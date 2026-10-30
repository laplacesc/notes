#!/bin/sh
# Run on the router AFTER resetting and restoring SSH access.
set -eu
PATH=/usr/sbin:/usr/bin:/sbin:/bin
BASE=/data/lucky-ram
HERE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[ "$(id -u)" = 0 ] || fail 'Run as root'
[ "$(uname -m)" = armv7l ] || fail 'This bundle is for armv7l only'
[ -f "$HERE/lucky-ram.sh" ] || fail 'Put both scripts in the same directory'
for tool in curl sha256sum flock uci tar mount; do
    command -v "$tool" >/dev/null 2>&1 || fail "Missing $tool"
done
[ -d /data ] || fail '/data missing'
free_kb=$(df -k /data | awk 'END {print $4}')
[ "$free_kb" -ge 4096 ] || fail '/data needs at least 4 MiB free; do not install over old Lucky'
pidof lucky >/dev/null 2>&1 && fail 'An existing Lucky is running; stop/remove its startup entry first'
if grep -qs lucky /etc/crontabs/root; then
    fail 'Old Lucky cron entry found; remove that specific entry before installing'
fi
uci -q get firewall.Lucky >/dev/null 2>&1 && fail 'Old firewall.Lucky entry found; inspect/remove old installer first'
# Probe writability before creating persistent files. Never remount encrypted config automatically.
probe=/etc/config/.lucky-ram-write-test.$$
(umask 077; : > "$probe") || fail '/etc/config is read-only: resolve stock-firmware persistence first; see the installation guide'
rm -f "$probe"
[ ! -e "$BASE" ] || fail '/data/lucky-ram already exists; do not overwrite an existing installation'
umask 077
mkdir -p "$BASE"
cp "$HERE/lucky-ram.sh" "$BASE/lucky-ram.sh"
chmod 700 "$BASE/lucky-ram.sh"
cat > "$BASE/source.conf" <<'SOURCE'
# Fixed official version. SHA256 is the tar.gz archive digest published by GitHub.
SOURCE_URL='http://192.168.31.2:6086/lucky/lucky_3.5.0_Linux_armv7.tar.gz'
SOURCE_SHA256='34761465b4b88f6a3f19c2190d68ca3bf963d9d347ed0bcd2f8a46a73c31ea09'
SOURCE_FORMAT='tar.gz'
SOURCE
uci set firewall.lucky_ram=include
uci set firewall.lucky_ram.type=script
# Firewall invokes include scripts with no arguments; use a tiny boot wrapper.
cat > "$BASE/boot.sh" <<'BOOT'
#!/bin/sh
/bin/sh /data/lucky-ram/lucky-ram.sh boot >/dev/null 2>&1 &
exit 0
BOOT
chmod 700 "$BASE/boot.sh"
uci set firewall.lucky_ram.path="$BASE/boot.sh"
uci set firewall.lucky_ram.enabled=1
uci commit firewall
/bin/sh "$BASE/lucky-ram.sh" boot
printf '\nInstalled. Download/start runs asynchronously. Wait 1-3 minutes, then:\n'
printf 'sh /data/lucky-ram/lucky-ram.sh status\n'
printf 'After configuring Lucky, run: sh /data/lucky-ram/lucky-ram.sh save\n'
printf 'A real reboot is required to validate persistent startup on this firmware.\n'
