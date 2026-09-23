# Hermes gateway hooks must be Python (a `handle` function in handler.py), so this is a shim:
# all the logic stays in manage_hermes.sh. Fire-and-forget: start_new_session detaches the
# script so a slow `npx dotenvx` never delays the gateway, and PM2 daemonises itself anyway.
#
# Every inherited HERMES_* variable is dropped. The bot gets its own HERMES_HOME from its encrypted
# .env via dotenvx, which does NOT override variables already set — so without this the
# gateway's value would win instead of .env's (both are /data today, but .env must decide), and
# PM2 would capture the platform's HERMES_WEBUI_PASSWORD into the bot's environment. 1ce88f5.
import os
import subprocess

WORKSPACE = "/data/workspace"


def handle(event_type, context):
    env = {k: v for k, v in os.environ.items() if not k.startswith("HERMES_")}
    with open(os.path.join(WORKSPACE, ".autostart.log"), "a") as log:
        subprocess.Popen(
            [os.path.join(WORKSPACE, "manage_hermes.sh"), "start"],
            cwd=WORKSPACE,
            env=env,
            stdout=log,
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )
