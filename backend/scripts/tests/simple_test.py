#!/usr/bin/env python3
import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
import json

# Load env
env_path = Path(__file__).parent.parent.parent / ".env"
print(f"Loading .env from: {env_path}")
load_dotenv(env_path)

# Get API key
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    print("ERROR: OPENAI_API_KEY not found in .env")
    exit(1)

print(f"✅ API key loaded")

# Initialize client
client = OpenAI(api_key=api_key)
print(f"✅ OpenAI client initialized")

# Find first audio file
ZOOM_DIR = Path.home() / "zoom_recordings"
audio_files = list(ZOOM_DIR.rglob("*.m4a"))
print(f"✅ Found {len(audio_files)} audio files")

if not audio_files:
    print("ERROR: No audio files found")
    exit(1)

# Pick smallest file for testing
test_file = min(audio_files, key=lambda f: f.stat().st_size)
size_mb = test_file.stat().st_size / (1024 * 1024)

print(f"\n📁 Testing with: {test_file.name}")
print(f"📏 Size: {size_mb:.2f} MB")
print(f"💰 Est. cost: ${size_mb * 0.006:.3f}")
print(f"\n🎙️  Starting transcription...")

# Transcribe
try:
    with open(test_file, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )

    print(f"✅ Transcription complete!")
    print(f"📝 Length: {len(transcript)} characters, {len(transcript.split())} words")
    print(f"\n📄 Preview (first 300 chars):")
    print(transcript[:300] + "...")

    # Save
    output_dir = Path(__file__).parent / "transcripts"
    output_dir.mkdir(exist_ok=True)
    output_file = output_dir / f"{test_file.stem}_transcript.json"

    with open(output_file, 'w') as f:
        json.dump({
            "transcript": transcript,
            "file": str(test_file),
            "size_mb": size_mb
        }, f, indent=2)

    print(f"\n💾 Saved to: {output_file}")
    print(f"\n🎉 SUCCESS! Ready to process all files.")

except Exception as e:
    print(f"❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
