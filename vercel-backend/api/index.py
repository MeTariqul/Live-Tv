import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app
from mangum import Mangum

lambda_handler = Mangum(app)
