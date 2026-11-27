"""Capture existing procedural Pip portraits using the game renderer."""
import base64
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
from urllib.error import URLError
from urllib.request import ProxyHandler, build_opener
from threading import Thread


def capture_pip(root, stage):
    browser = os.environ.get("CHROMIUM") or shutil.which("chromium") or shutil.which("google-chrome")
    if not browser:
        raise RuntimeError("Chromium is required to capture Pip. Set CHROMIUM or pass --skip-pip.")
    moods = ("attentive", "thinking", "happy", "sorry", "worried", "alarmed", "exasperated")
    variants = [(mood, "", None, False, False) for mood in moods]
    variants += [(mood, "lipstick", None, True, False) for mood in moods]
    variants += [("attentive", disguise, disguise, False, False) for disguise in ("moustache", "eyePatch", "woman")]
    variants += [("attentive", "milk moustache", None, False, True),
                 ("attentive", "milk moustache and lipstick", None, True, True)]
    page = stage / "capture.html"
    module = "/src/pip-art.mjs"
    page.write_text(f"""<!doctype html><meta charset=utf-8><body><script type="module">
import {{drawPipPortrait}} from {json.dumps(module)};
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 512;
for (const [index, [mood, variant, disguise, lipstick, milk]] of {json.dumps(variants)}.entries()) {{
    drawPipPortrait(canvas, mood, disguise, lipstick, milk);
    const image = document.createElement('img');
    image.id = String(index);
    image.src = canvas.toDataURL();
    document.body.append(image);
}}
</script>""")
    class Handler(SimpleHTTPRequestHandler):
        def translate_path(self, path):
            if path == "/__pip_capture.html":
                return str(page)
            return super().translate_path(path)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=root))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    target = f"http://127.0.0.1:{server.server_port}/__pip_capture.html"
    profile = stage / "chrome"
    port = int(os.environ.get("PIP_DEBUG_PORT", "19291"))
    debugger = f"http://127.0.0.1:{port}"
    cmd = [browser, "--headless", "--disable-dev-shm-usage",
           f"--remote-debugging-port={port}", "--user-data-dir=" + str(profile)]
    if os.environ.get("CHROMIUM_NO_SANDBOX") == "1":
        cmd.append("--no-sandbox")
    log_path = stage / "chrome.log"
    endpoint = debugger + "/json/list"
    opener = build_opener(ProxyHandler({}))
    last_error = "no response"
    with log_path.open("w") as log:
        chrome = subprocess.Popen([*cmd, "about:blank"], stdout=log, stderr=log)
        try:
            for _ in range(100):
                if chrome.poll() is not None:
                    raise RuntimeError(
                        f"Chromium {browser} exited with status {chrome.returncode} "
                        f"before opening {endpoint}:\n{log_path.read_text()}"
                    )
                try:
                    with opener.open(endpoint, timeout=0.5) as response:
                        if response.status == 200:
                            break
                except (URLError, TimeoutError) as error:
                    last_error = str(error)
                    time.sleep(0.1)
            else:
                raise RuntimeError(
                    f"Chromium {browser} did not open {endpoint} ({last_error}):\n{log_path.read_text()}"
                )
            result = subprocess.run(
                ["node", str(root / "creative/capture-pip.mjs"), debugger,
                 target, str(len(variants))], capture_output=True, text=True, timeout=25
            )
            if result.returncode:
                raise RuntimeError(result.stderr.strip())
            rendered = dict(json.loads(result.stdout))
        finally:
            chrome.terminate()
            try:
                chrome.wait(timeout=10)
            except subprocess.TimeoutExpired:
                chrome.kill()
                chrome.wait()
            server.shutdown()
            server.server_close()
    captures = stage / "pip"
    captures.mkdir()
    for index, (mood, variant, *_) in enumerate(variants):
        image = captures / f"{index}.png"
        image.write_bytes(base64.b64decode(rendered[str(index)].split(",", 1)[1]))
        yield {"character": "pip", "mood": mood, "variant": variant, "asset": "src/pip-art.mjs",
               "image": image, "cell": None, "default": mood == "attentive" and not variant}
