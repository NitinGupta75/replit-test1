from fastapi import FastAPI, Request, File, UploadFile, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from pathlib import Path
import logging
import traceback

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL is None:
    raise ValueError("DATABASE_URL environment variable is not set")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, index=True)
    uploaded_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by_user_id = Column(String)
    size_mb = Column(Float)
    file_type = Column(String)

Base.metadata.create_all(bind=engine)

class CustomStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if path.endswith('.css'):
            response.headers['Content-Type'] = 'text/css'
        return response

app = FastAPI()

# Mount the static directory with custom class
app.mount("/static", CustomStaticFiles(directory="static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Create an uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = UPLOAD_DIR / file.filename
        logger.debug(f"Uploading file to: {file_path}")
        with file_path.open("wb") as buffer:
            contents = await file.read()
            buffer.write(contents)
        
        logger.info(f"File saved successfully to: {file_path}")
        
        size_mb = len(contents) / (1024 * 1024)  # Convert to MB
        
        db = SessionLocal()
        new_file = UploadedFile(
            file_name=file.filename,
            uploaded_by_user_id="anonymous",  # Replace with actual user ID when you have a user system
            size_mb=size_mb,
            file_type=file.content_type
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        db.close()

        logger.info(f"File uploaded successfully: {new_file.id}")
        return JSONResponse(content={"message": "File uploaded successfully", "file_id": new_file.id})
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/files")
async def list_files():
    try:
        db = SessionLocal()
        files = db.query(UploadedFile).all()
        db.close()
        return [{"id": file.id, "file_name": file.file_name, "uploaded_date": file.uploaded_date, "size_mb": file.size_mb, "file_type": file.file_type} for file in files]
    except Exception as e:
        logger.error(f"Error listing files: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/download/{file_id}")
async def download_file(file_id: int):
    try:
        db = SessionLocal()
        file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
        db.close()
        
        if not file:
            logger.error(f"File with id {file_id} not found in database")
            raise HTTPException(status_code=404, detail="File not found in database")
        
        file_path = UPLOAD_DIR / file.file_name
        logger.debug(f"Constructed full file path: {file_path.absolute()}")
        file_exists = os.path.exists(file_path)
        logger.debug(f"File exists: {file_exists}")
        
        if not file_exists:
            logger.error(f"File not found on server: {file_path}")
            logger.debug(f"Contents of UPLOAD_DIR: {[f.name for f in UPLOAD_DIR.iterdir()]}")
            raise HTTPException(status_code=404, detail="File not found on server")
        
        logger.info(f"File found, attempting to serve: {file_path}")
        return FileResponse(str(file_path), filename=file.file_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")

def verify_database_integrity():
    db = SessionLocal()
    files = db.query(UploadedFile).all()
    discrepancies = []
    
    for file in files:
        file_path = UPLOAD_DIR / file.file_name
        if not file_path.exists():
            discrepancies.append(file)
            logger.warning(f"Discrepancy found: File {file.file_name} (ID: {file.id}) exists in database but not on disk")
    
    db.close()
    return discrepancies

def cleanup_database():
    discrepancies = verify_database_integrity()
    if discrepancies:
        db = SessionLocal()
        for file in discrepancies:
            db.delete(file)
            logger.info(f"Removed database entry for missing file: {file.file_name} (ID: {file.id})")
        db.commit()
        db.close()
    else:
        logger.info("No discrepancies found, database cleanup not needed")

@app.on_event("startup")
async def startup_event():
    logger.info("Verifying database integrity on startup")
    discrepancies = verify_database_integrity()
    if discrepancies:
        logger.warning(f"Found {len(discrepancies)} discrepancies between database and file system")
        cleanup_database()
    else:
        logger.info("Database integrity verified, no discrepancies found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
