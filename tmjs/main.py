from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

app = FastAPI()

# Mount the static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve index.html directly from the root path
@app.get("/")
async def read_index():
    return FileResponse("static/index.html")