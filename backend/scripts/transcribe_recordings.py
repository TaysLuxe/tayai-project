#!/usr/bin/env python3
"""
Zoom Recordings Transcription Script
Transcribes all audio files from zoom_recordings folder using OpenAI Whisper API
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List
import time
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

# Paths
ZOOM_RECORDINGS_DIR = Path(__file__).parent.parent / "data/sources/zoom_recordings"
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
    parent_folder = file_path.parts[-3]  # Gets the main category folder
    return CATEGORY_MAPPING.get(parent_folder, "general")


def extract_metadata(file_path: Path) -> Dict:
    """Extract metadata from file path and name"""
    # Get session date from folder name (e.g., "17-11-2024_2332")
    date_folder = file_path.parts[-2]

    # Try to parse date from folder name
    try:
        date_part = date_folder.split('_')[0]
        # Format: DD-MM-YYYY
        day, month, year = date_part.split('-')
        session_date = f"{year}-{month}-{day}"
    except:
        session_date = "unknown"

    # Get category
    category = get_category_from_path(file_path)

    # Get parent folder name as session type
    session_type = file_path.parts[-3]

    return {
        "source": "zoom_recording",
        "session_date": session_date,
        "category": category,
        "session_type": session_type,
        "file_name": file_path.name,
        "transcribed_at": datetime.now().isoformat()
    }


def transcribe_audio(audio_path: Path) -> str:
    """Transcribe audio file using OpenAI Whisper API"""
    print(f"  Transcribing: {audio_path.name}")

    try:
        with open(audio_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text"
            )

        return transcript
    except Exception as e:
        print(f"  ERROR transcribing {audio_path.name}: {str(e)}")
        return None


def save_transcript(transcript: str, metadata: Dict, output_path: Path):
    """Save transcript and metadata to JSON file"""
    data = {
        "transcript": transcript,
        "metadata": metadata
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"  Saved: {output_path.name}")


def find_audio_files() -> List[Path]:
    """Find all audio files in zoom_recordings directory"""
    audio_extensions = ['.m4a', '.mp3', '.wav', '.mp4']
    audio_files = []

    for ext in audio_extensions:
        audio_files.extend(ZOOM_RECORDINGS_DIR.rglob(f"*{ext}"))

    # Filter out video files if we only want audio
    audio_files = [f for f in audio_files if f.suffix in ['.m4a', '.mp3', '.wav', '.mp4']]

    return sorted(audio_files)


def estimate_cost(num_files: int, avg_duration_minutes: float = 60) -> float:
    """Estimate transcription cost (Whisper API: $0.006 per minute)"""
    total_minutes = num_files * avg_duration_minutes
    cost = total_minutes * 0.006
    return cost


def main():
    print("=" * 70)
    print("ZOOM RECORDINGS TRANSCRIPTION")
    print("=" * 70)
    print()

    # Find all audio files
    print("Scanning for audio files...")
    audio_files = find_audio_files()

    if not audio_files:
        print("❌ No audio files found in zoom_recordings directory")
        return

    print(f"✅ Found {len(audio_files)} audio files")
    print()

    # Show category breakdown
    category_counts = {}
    for audio_file in audio_files:
        category = get_category_from_path(audio_file)
        category_counts[category] = category_counts.get(category, 0) + 1

    print("Category breakdown:")
    for category, count in sorted(category_counts.items()):
        print(f"  - {category}: {count} files")
    print()

    # Estimate cost
    estimated_cost = estimate_cost(len(audio_files))
    print(f"💰 Estimated cost: ${estimated_cost:.2f} (assuming 60min avg per file)")
    print(f"   Note: Whisper API costs $0.006 per minute of audio")
    print()

    # Ask for confirmation
    response = input("Do you want to proceed with transcription? (yes/no): ").strip().lower()
    if response not in ['yes', 'y']:
        print("❌ Transcription cancelled")
        return

    print()
    print("=" * 70)
    print("STARTING TRANSCRIPTION")
    print("=" * 70)
    print()

    # Process each audio file
    successful = 0
    failed = 0
    skipped = 0

    for i, audio_path in enumerate(audio_files, 1):
        print(f"[{i}/{len(audio_files)}] Processing: {audio_path.relative_to(ZOOM_RECORDINGS_DIR)}")

        # Generate output filename
        output_filename = f"{audio_path.stem}_transcript.json"
        output_path = TRANSCRIPTS_DIR / output_filename

        # Skip if already transcribed
        if output_path.exists():
            print(f"  ⏭️  Already transcribed, skipping...")
            skipped += 1
            continue

        # Extract metadata
        metadata = extract_metadata(audio_path)

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

        # Rate limiting - small delay between requests
        if i < len(audio_files):
            time.sleep(1)

    # Summary
    print("=" * 70)
    print("TRANSCRIPTION COMPLETE")
    print("=" * 70)
    print(f"✅ Successful: {successful}")
    print(f"⏭️  Skipped (already done): {skipped}")
    print(f"❌ Failed: {failed}")
    print(f"📁 Transcripts saved to: {TRANSCRIPTS_DIR}")
    print()
    print("Next step: Run bulk_upload_transcripts.py to upload to knowledge base")
    print("=" * 70)


if __name__ == "__main__":
    main()
