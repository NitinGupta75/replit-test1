from fastapi import FastAPI, Request, File, UploadFile
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os
from pathlib import Path

# Database setup
DATABASE_URL = os.environ.get('DATABASE_URL')
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

@app.get("/")
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
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

    return JSONResponse(content={"message": "File uploaded successfully", "file_id": new_file.id})

@app.get("/list_files")
async def list_files():
    db = SessionLocal()
    files = db.query(UploadedFile).all()
    db.close()
    
    file_list = [
        {
            "id": file.id,
            "file_name": file.file_name,
            "uploaded_date": file.uploaded_date.isoformat(),
            "size_mb": round(file.size_mb, 2),
            "file_type": file.file_type
        }
        for file in files
    ]
    
    return JSONResponse(content={"files": file_list})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
