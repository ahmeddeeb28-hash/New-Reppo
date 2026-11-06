#!/usr/bin/env bash
# Regenerates the voiceover lines with Piper (free, local neural TTS).
#   pip install piper-tts
#   curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/en/en_US/lessac/high/en_US-lessac-high.onnx{,.json}
# Run from project/: bash voice/make-voice.sh path/to/en_US-lessac-high.onnx
set -euo pipefail
MODEL="$1"; mkdir -p public/vo voice/raw
python3 - "$MODEL" <<'PY'
import json, subprocess, sys
for key, text in json.load(open("voice/lines.json")):
    subprocess.run(["piper", "-m", sys.argv[1], "-f", f"voice/raw/{key}.wav", "--sentence-silence", "0.2"], input=text.encode(), check=True)
PY
for f in voice/raw/*.wav; do
  ffmpeg -loglevel error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,highpass=f=90,equalizer=f=3000:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,loudnorm=I=-15:TP=-1.5:LRA=7,aresample=48000" -ar 48000 "public/vo/$(basename "$f")"
done
echo "Update the VO table lengths in src/Main.tsx if a line's duration changed."
