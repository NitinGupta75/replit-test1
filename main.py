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

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="templates")

# Create an uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/files")
async def list_files(page: int = 1, items_per_page: int = 10, search: str = ''):
    try:
        db = SessionLocal()
        query = db.query(UploadedFile)
        if search:
            query = query.filter(UploadedFile.file_name.ilike(f'%{search}%'))
        total_files = query.count()
        files = query.order_by(UploadedFile.uploaded_date.desc()).offset((page - 1) * items_per_page).limit(items_per_page).all()
        db.close()
        return {
            "files": [
                {
                    "id": file.id,
                    "file_name": file.file_name,
                    "uploaded_date": file.uploaded_date,
                    "size_mb": file.size_mb,
                    "file_type": file.file_type
                } for file in files
            ],
            "total_files": total_files
        }
    except Exception as e:
        logger.error(f"Error fetching files: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
