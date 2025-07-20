import logging
import os
from datetime import datetime

# --- Ensure logs directory exists ---
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

# --- Main logger setup ---
logger = logging.getLogger("docker_manager")
logger.setLevel(logging.INFO)

if not logger.handlers:
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # Daily log file
    log_filename = datetime.now().strftime("%Y-%m-%d") + ".log"
    log_path = os.path.join(log_dir, log_filename)
    file_handler = logging.FileHandler(log_path)
    file_handler.setLevel(logging.INFO)

    # Formatter
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    # Add handlers
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

# --- Rollback logger setup ---
rollback_logger = logging.getLogger("rollback_logger")
rollback_logger.setLevel(logging.INFO)

if not rollback_logger.handlers:
    rollback_file_path = os.path.join(log_dir, "docker_rollback.log")
    rollback_file_handler = logging.FileHandler(rollback_file_path)
    rollback_file_handler.setLevel(logging.INFO)

    rollback_formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    rollback_file_handler.setFormatter(rollback_formatter)

    rollback_logger.addHandler(rollback_file_handler)
