#!/usr/bin/env python3
"""
Test script - Transcribe just 1-2 files to verify everything works
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import time
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from project root
project_root = Path(__file__).parent.parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Paths
ZOOM_RECORDINGS_DIR = Path.home() / "zoom_recordings"
TRANSCRIPTS_DIR = Path(__file__).parent / "transcripts"
TRANSCRIPTS_DIR.mkdir(exist_ok=True)

# Category mapping based on folder names
CATEGORY_MAPPING = {
    "TLA Mentorship Lessons": "business_mentorship",
    "Round 3 Mentorship": "business_mentorship",
    "Round 4 Waitlist & Mentorship": "business_mentorship",
    "Round 5 Mentorship": "business_mentorship",
    "Free Masterclasses": "hair_education",
    "Guest Speaker Sessions": "business_mentorship",
    "Round 5 Guest Speaker Sessions": "business_mentorship",
    "Round 5 Launch Lessons": "business_mentorship",
    "Master Hair Industry Challenge": "hair_education",
}


def get_category_from_path(file_path: Path) -> str:
    """Extract category from file path based on parent folder"""
    parent_folder = file_path.parts[-3]
    return CATEGORY_MAPPING.get(parent_folder, "general")


def extract_metadata(file_path: Path) -> Dict:
    """Extract metadata from file path and name"""
    date_folder = file_path.parts[-2]

    try:
        date_part = date_folder.split('_')[0]
        day, month, year = date_part.split('-')
        session_date = f"{year}-{month}-{day}"
    except:
        session_date = "unknown"

    category = get_category_from_path(file_path)
    session_type = file_path.parts[-3]

    return {
        "source": "zoom_recording",
        "session_date": session_date,
        "category": category,
        "session_type": session_type,
        "file_name": file_path.name,
        "transcribed_at": datetime.now().isoformat()
    }


def get_file_duration(file_path: Path) -> float:
    """Get audio file duration in minutes (estimated from file size)"""
    # Rough estimate: 1MB ~ 1 minute for m4a at typical bitrates
    size_mb = file_path.stat().st_size / (1024 * 1024)
    return size_mb


def transcribe_audio(audio_path: Path) -> str:
    """Transcribe audio file using OpenAI Whisper API"""
    print(f"  Transcribing: {audio_path.name}")

    # Show file size
    size_mb = audio_path.stat().st_size / (1024 * 1024)
    print(f"  File size: {size_mb:.2f} MB")

    try:
        with open(audio_path, "rb") as audio_file:
            print(f"  Sending to Whisper API...")
            start_time = time.time()

            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

            elapsed = time.time() - start_time
            print(f"  ✅ Completed in {elapsed:.1f}s")

            # Show preview
            preview = transcript[:200] + "..." if len(transcript) > 200 else transcript
            print(f"  Preview: {preview}")

        return transcript
    except Exception as e:
        print(f"  ❌ ERROR: {str(e)}")
        return None


def save_transcript(transcript: str, metadata: Dict, output_path: Path):
    """Save transcript and metadata to JSON file"""
    data = {
        "transcript": transcript,
        "metadata": metadata,
        "word_count": len(transcript.split()),
        "char_count": len(transcript)
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"  💾 Saved: {output_path.name}")
    print(f"  Word count: {data['word_count']}, Characters: {data['char_count']}")


def find_audio_files() -> List[Path]:
    """Find all audio files in zoom_recordings directory"""
    audio_extensions = ['.m4a', '.mp3', '.wav']
    audio_files = []

    for ext in audio_extensions:
        audio_files.extend(ZOOM_RECORDINGS_DIR.rglob(f"*{ext}"))

    return sorted(audio_files)


def main():
    print("=" * 70)
    print("TEST TRANSCRIPTION - Processing 2 files")
    print("=" * 70)
    print()

    # Find all audio files
    print("Scanning for audio files...")
    audio_files = find_audio_files()

    if not audio_files:
        print("❌ No audio files found in zoom_recordings directory")
        return

    print(f"✅ Found {len(audio_files)} total audio files")
    print()

    # Select 2 files to test (one from each category if possible)
    test_files = []

    # Try to get one from each category
    categories_seen = set()
    for audio_file in audio_files:
        category = get_category_from_path(audio_file)
        if category not in categories_seen:
            test_files.append(audio_file)
            categories_seen.add(category)
            if len(test_files) >= 2:
                break

    # If we didn't get 2 files from different categories, just take first 2
    if len(test_files) < 2 and len(audio_files) >= 2:
        test_files = audio_files[:2]
    elif len(test_files) < 1:
        test_files = audio_files[:1]

    print(f"📋 Testing with {len(test_files)} file(s):")
    for i, f in enumerate(test_files, 1):
        size_mb = f.stat().st_size / (1024 * 1024)
        category = get_category_from_path(f)
        print(f"  {i}. {f.name} ({size_mb:.1f}MB, {category})")
    print()

    # Estimate cost
    total_size_mb = sum(f.stat().st_size / (1024 * 1024) for f in test_files)
    estimated_cost = total_size_mb * 0.006  # Rough estimate
    print(f"💰 Estimated cost for test: ${estimated_cost:.3f}")
    print()

    # Process each test file
    successful = 0
    failed = 0

    for i, audio_path in enumerate(test_files, 1):
        print("=" * 70)
        print(f"[{i}/{len(test_files)}] Processing: {audio_path.relative_to(ZOOM_RECORDINGS_DIR)}")
        print("=" * 70)

        # Generate output filename
        output_filename = f"{audio_path.stem}_transcript.json"
        output_path = TRANSCRIPTS_DIR / output_filename

        # Skip if already transcribed
        if output_path.exists():
            print(f"  ⏭️  Already transcribed, skipping...")
            successful += 1
            continue

        # Extract metadata
        metadata = extract_metadata(audio_path)
        print(f"  Category: {metadata['category']}")
        print(f"  Session Type: {metadata['session_type']}")
        print(f"  Date: {metadata['session_date']}")
        print()

        # Transcribe
        transcript = transcribe_audio(audio_path)

        if transcript:
            # Save transcript
            save_transcript(transcript, metadata, output_path)
            successful += 1
            print(f"  ✅ Success!")
        else:
            failed += 1
            print(f"  ❌ Failed!")

        print()

    # Summary
    print("=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"📁 Transcripts saved to: {TRANSCRIPTS_DIR}")
    print()

    if successful > 0:
        print("🎉 Test successful! You can now:")
        print("   1. Review the transcripts in the 'transcripts' folder")
        print("   2. Run 'transcribe_recordings.py' to process all 44 files")
        print("   3. Run 'bulk_upload_transcripts.py' to upload to knowledge base")

    print("=" * 70)


if __name__ == "__main__":
    main()
