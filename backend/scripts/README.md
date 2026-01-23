# Scripts Directory

Utility scripts for data processing, knowledge base management, and testing.

## Production Scripts

### Knowledge Base Management
- `build_foundational_kb.py` - Build foundational knowledge base from source files
- `kb_coverage_checker.py` - Analyze KB coverage and identify gaps
- `kb_namespace_mapper.py` - Map content to KB namespaces
- `weekly_kb_review.py` - Generate weekly KB review reports

### Data Processing
- `process_ig_posts.py` - Process Instagram posts from CSV
- `download_zoom_transcripts.py` - Download Zoom transcripts
- `transcribe_recordings.py` - Transcribe audio recordings using Whisper API

## Test Scripts

Test scripts are located in the `tests/` subdirectory:
- `simple_test.py` - Simple API connection test (tests OpenAI API with one file)
- `transcribe_test.py` - Test transcription with 1-2 sample files before full batch

**Note**: These are development/testing scripts. They create output in the `transcripts/` subdirectory.

## Usage

All scripts should be run from the `backend/` directory:

```bash
cd backend
python scripts/build_foundational_kb.py
```

Most scripts support `--help` or `--dry-run` flags for safe testing.
