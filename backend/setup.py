import os
import subprocess
import sys
import platform
from setuptools import setup, find_packages

def install_system_dependencies():
    """Install system-level dependencies required by some Python packages."""
    system = platform.system().lower()
    
    if system == 'linux':
        # Install system dependencies on Linux
        try:
            subprocess.run(['sudo', 'apt-get', 'update'], check=True)
            subprocess.run([
                'sudo', 'apt-get', 'install', '-y',
                'build-essential',
                'python3-dev',
                'python3-pip',
                'python3-venv',
                'libpq-dev',  # For psycopg2
                'ta-lib',     # For technical analysis
                'redis-server',
                'libatlas-base-dev',  # For numpy
                'gfortran',
                'pkg-config',
                'libfreetype6-dev',
                'libpng-dev'
            ], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error installing system dependencies: {e}")
            sys.exit(1)
            
    elif system == 'darwin':  # macOS
        try:
            # Check if Homebrew is installed
            if subprocess.run(['which', 'brew'], capture_output=True).returncode != 0:
                print("Installing Homebrew...")
                subprocess.run([
                    '/bin/bash', '-c',
                    '$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)'
                ], check=True)
            
            # Install dependencies using Homebrew
            subprocess.run(['brew', 'update'], check=True)
            subprocess.run(['brew', 'install', 'ta-lib'], check=True)
            subprocess.run(['brew', 'install', 'redis'], check=True)
            subprocess.run(['brew', 'install', 'postgresql'], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error installing system dependencies: {e}")
            sys.exit(1)
            
    elif system == 'windows':
        print("On Windows, please install the following manually:")
        print("1. Download and install TA-Lib from: http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-msvc.zip")
        print("2. Install Redis from: https://github.com/microsoftarchive/redis/releases")
        print("3. Install PostgreSQL from: https://www.postgresql.org/download/windows/")
        input("Press Enter once you have installed these dependencies...")

def setup_python_environment():
    """Set up Python virtual environment and install dependencies."""
    try:
        # Create virtual environment if it doesn't exist
        if not os.path.exists('venv'):
            subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
        
        # Determine the pip path
        pip_cmd = os.path.join('venv', 'Scripts' if platform.system() == 'Windows' else 'bin', 'pip')
        
        # Upgrade pip
        subprocess.run([pip_cmd, 'install', '--upgrade', 'pip'], check=True)
        
        # Install requirements
        subprocess.run([pip_cmd, 'install', '-r', 'requirements.txt'], check=True)
        
        print("Python environment setup completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error setting up Python environment: {e}")
        sys.exit(1)

def setup_development_tools():
    """Set up additional development tools and configurations."""
    try:
        # Create necessary directories
        os.makedirs('logs', exist_ok=True)
        os.makedirs('models', exist_ok=True)
        os.makedirs('data', exist_ok=True)
        
        # Copy example environment file if it doesn't exist
        if not os.path.exists('.env'):
            with open('.env.example', 'r') as src, open('.env', 'w') as dst:
                dst.write(src.read())
            print("Created .env file from template. Please update with your settings.")
        
        # Initialize pre-commit hooks if git is available
        if subprocess.run(['which', 'git'], capture_output=True).returncode == 0:
            subprocess.run(['pip', 'install', 'pre-commit'], check=True)
            subprocess.run(['pre-commit', 'install'], check=True)
            print("Initialized pre-commit hooks")
    except Exception as e:
        print(f"Error setting up development tools: {e}")
        sys.exit(1)

def main():
    """Main setup function."""
    print("Starting AISTM7 backend setup...")
    
    # Install system dependencies
    print("\nInstalling system dependencies...")
    install_system_dependencies()
    
    # Set up Python environment
    print("\nSetting up Python environment...")
    setup_python_environment()
    
    # Set up development tools
    print("\nSetting up development tools...")
    setup_development_tools()
    
    print("\nSetup completed successfully!")
    print("\nNext steps:")
    print("1. Update the .env file with your configuration")
    print("2. Start Redis server")
    print("3. Run database migrations")
    print("4. Start the development server with: python run.py")

if __name__ == '__main__':
    main()

# Package setup configuration
setup(
    name="aistm7-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        # Dependencies are managed through requirements.txt
    ],
    python_requires=">=3.9",
    author="Your Name",
    author_email="your.email@example.com",
    description="AISTM7 Risk Analysis Platform Backend",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/aistm7",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.9",
    ],
)