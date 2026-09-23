# Hermes gateway hooks must be Python (a `handle` function in handler.py), so this is a shim:
# all the logic stays in manage_hermes.sh. Fire-and-forget: start_new_session detaches the
# script so a slow `npx dotenvx` never delays the gateway, and PM2 daemonises itself anyway.
#
# Every HERMES_* variable is dropped. The gateway runs with HERMES_HOME=/data, while the bot's
# own hermes CLI lives under /data/.hermes; PM2 would capture the inherited value and the bot's
# every Hermes call would run against the wrong home. It also keeps the platform's web-UI
# password out of the bot's environment. Issue 1ce88f5.
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
