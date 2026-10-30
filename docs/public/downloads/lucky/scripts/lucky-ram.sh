#!/bin/sh
# Xiaomi RN02 stock firmware: bounded RAM runtime, explicit persistent snapshots.
set -eu
PATH=/usr/sbin:/usr/bin:/sbin:/bin
BASE=/data/lucky-ram
RUN=/tmp/lucky-program
STATE=/tmp/lucky-state
CONF=$BASE/source.conf
SERVICE=/etc/init.d/lucky-ram
fail() { logger -t lucky-ram "ERROR: $*"; printf '%s\n' "ERROR: $*" >&2; exit 1; }
mounted() { awk -v p="$1" '$2==p && $3=="tmpfs" {ok=1} END {exit !ok}' /proc/mounts; }
mount_ram() {
    mkdir -p "$1"
    mounted "$1" || mount -t tmpfs -o "size=$2,mode=0700,nosuid,nodev" lucky-ram "$1"
    mounted "$1" || fail "Not a tmpfs: $1"
}
prepare() {
    [ "$(uname -m)" = armv7l ] || fail 'Expected armv7l; recheck firmware/architecture'
    [ -f "$CONF" ] || fail "Missing $CONF"
    . "$CONF"
    mount_ram "$RUN" 32m
    mount_ram "$STATE" 8m
    if [ ! -f "$STATE/.restored" ]; then
        [ ! -f "$BASE/config.tgz" ] || tar -xzf "$BASE/config.tgz" -C "$STATE"
        touch "$STATE/.restored"
    fi
    mkdir -p "$STATE/tmp"
    export TMPDIR="$STATE/tmp" HOME="$STATE"
    if [ ! -x "$RUN/lucky" ]; then
        available=$(awk '/MemAvailable:/ {print $2}' /proc/meminfo)
        [ "${available:-0}" -ge 49152 ] || fail 'Less than 48 MiB available RAM; stop other plugins first'
        case "$SOURCE_URL" in https://*|http://*) ;; *) fail 'Use an HTTP(S) source URL' ;; esac
        rm -f "$RUN/package" "$RUN/lucky.new"
        curl --fail --location --connect-timeout 15 --max-time 180 --max-filesize 16777216 \
            --output "$RUN/package" "$SOURCE_URL" || { rm -f "$RUN/package"; fail 'Download failed'; }
        printf '%s  %s\n' "$SOURCE_SHA256" "$RUN/package" | sha256sum -c - >/dev/null || {
            rm -f "$RUN/package"; fail 'SHA256 mismatch';
        }
        case "$SOURCE_FORMAT" in
            raw) mv "$RUN/package" "$RUN/lucky.new" ;;
            tar.gz)
                # Extract exactly the executable; never unpack upstream scripts or paths.
                member=$(tar -tzf "$RUN/package" | awk '$0=="lucky" || $0=="./lucky" {print}')
                [ "$member" = lucky ] || [ "$member" = ./lucky ] || fail 'Unexpected archive layout'
                tar -xzOf "$RUN/package" "$member" > "$RUN/lucky.new"
                rm -f "$RUN/package"
                ;;
            *) fail 'SOURCE_FORMAT must be raw or tar.gz' ;;
        esac
        chmod 700 "$RUN/lucky.new"
        mv "$RUN/lucky.new" "$RUN/lucky"
    fi
}
boot() {
    exec 9>/tmp/lucky-ram-boot.lock
    flock -n 9 || exit 0
    [ -f "$CONF" ] || fail 'Install source.conf first'
    cat > "$SERVICE" <<'INIT'
#!/bin/sh /etc/rc.common
START=95
USE_PROCD=1
start_service() {
    procd_open_instance
    procd_set_param command /bin/sh /data/lucky-ram/lucky-ram.sh run
    procd_set_param respawn 3600 30 0
    procd_set_param stdout 0
    procd_set_param stderr 0
    procd_close_instance
}
INIT
    chmod 755 "$SERVICE"
    # Stock rc.common's default running() always succeeds; submit to procd directly.
    "$SERVICE" start
    printf '%s\n' 'Start requested; use status to check the process and procd instance.'
}
save_config() {
    [ -x "$SERVICE" ] || fail 'Run boot first'
    mounted "$STATE" || fail 'State tmpfs is not mounted'
    exec 9>/tmp/lucky-ram-save.lock
    flock -n 9 || fail 'Another save is running'
    "$SERVICE" stop
    # Ensure the instance actually exited before reading multiple configuration files.
    i=0
    while pidof lucky >/dev/null 2>&1; do
        i=$((i+1))
        [ "$i" -lt 20 ] || fail 'Lucky still running; snapshot not written. Check for a second installation'
        sleep 1
    done
    trap '"$SERVICE" start >/dev/null 2>&1 || true' EXIT
    cd "$STATE"
    set -- lucky_*.lkcf
    [ -f "$1" ] || fail 'No Lucky module configuration files found'
    # Only top-level module settings/certificates; no DB, downloads, logs or binary.
    for file do
        [ -f "$file" ] && [ ! -L "$file" ] || fail "Unexpected configuration entry: $file"
    done
    tar -czf "$STATE/config.new.tgz" "$@"
    bytes=$(wc -c < "$STATE/config.new.tgz")
    [ "$bytes" -le 524288 ] || fail 'Snapshot exceeds 512 KiB; remove unused certificates/rules first'
    free_kb=$(df -k "$BASE" | awk 'END {print $4}')
    [ "$free_kb" -ge 2048 ] || fail '/data has less than 2 MiB free; snapshot not written'
    if [ -f "$BASE/config.tgz" ] && cmp -s "$STATE/config.new.tgz" "$BASE/config.tgz"; then
        printf '%s\n' 'Configuration unchanged'
        return
    fi
    # Stage beside destination, then rename atomically on the same filesystem.
    cp "$STATE/config.new.tgz" "$BASE/config.next.tgz"
    if [ -f "$BASE/config.tgz" ]; then
        cp "$BASE/config.tgz" "$BASE/config.previous.next.tgz"
        mv "$BASE/config.previous.next.tgz" "$BASE/config.previous.tgz"
    fi
    mv "$BASE/config.next.tgz" "$BASE/config.tgz"
    sync
    printf 'Saved configuration: %s bytes\n' "$bytes"
}
case "${1:-status}" in
    boot) boot ;;
    run)
        prepare
        cd "$STATE"
        exec "$RUN/lucky" -cd "$STATE" -ds
        ;;
    save) save_config ;;
    stop) [ ! -x "$SERVICE" ] || "$SERVICE" stop ;;
    start) boot ;;
    status)
        df -h /data "$RUN" "$STATE" 2>/dev/null || true
        printf '\nLucky process:\n'
        pidof lucky || true
        printf '\nProcd service:\n'
        ubus call service list '{"name":"lucky-ram"}' || true
        printf '\nSnapshots:\n'
        ls -lh "$BASE"/*.tgz 2>/dev/null || true
        ;;
    *) fail 'Usage: lucky-ram.sh boot|start|stop|save|status' ;;
esac
