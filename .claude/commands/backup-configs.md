# /backup-configs

将多个开发工具配置目录备份到 iCloud Drive，压缩包名去掉前导 `.`。

## 备份清单

| 源目录 | 压缩包名 |
|--------|----------|
| `~/.cc-switch` | `cc-switch.zip` |
| `~/.skills-manager` | `skills-manager.zip` |
| `~/.warp` | `warp.zip` |
| `~/Library/Application Support/reasonix` | `reasonix.zip` |
| `~/.config/zed` | `zed.zip` |
| `~/Library/Application Support/JetBrains/IntelliJIdea2026.1` | `IntelliJIdea2026.1.zip` |

## 执行步骤

1. **定义备份清单并检查**
   ```bash
   # 格式：source_path|package_name（不含 .zip，不含引号，目录名中如有空格需转义）
   ITEMS=(
     "$HOME/.cc-switch|cc-switch"
     "$HOME/.skills-manager|skills-manager"
     "$HOME/.warp|warp"
     "$HOME/Library/Application Support/reasonix|reasonix"
     "$HOME/.config/zed|zed"
     "$HOME/Library/Application Support/JetBrains/IntelliJIdea2026.1|IntelliJIdea2026.1"
   )
   ```

2. **确保目标目录存在**
   ```bash
   TARGET_DIR="/Users/jxwu/Library/Mobile Documents/com~apple~CloudDocs/软件/tool-config"
   mkdir -p "$TARGET_DIR"
   ```

3. **循环打包并复制到 iCloud Drive**
   ```bash
   FAILED_ITEMS=()
   for item in "${ITEMS[@]}"; do
     SRC="${item%%|*}"
     NAME="${item##*|}"
     
     # 检查源目录是否存在
     if [ ! -d "$SRC" ]; then
       echo "⚠️ 跳过: $SRC 不存在"
       continue
     fi
     
     # 打包压缩
     DIRNAME="$(dirname "$SRC")"
     BASENAME="$(basename "$SRC")"
     echo "📦 打包 $BASENAME → /tmp/$NAME.zip"
     cd "$DIRNAME" && zip -rq "/tmp/$NAME.zip" "$BASENAME"
     
     # 尝试复制到 iCloud Drive
     if cp "/tmp/$NAME.zip" "$TARGET_DIR/$NAME.zip" 2>/dev/null; then
       echo "✅ $NAME.zip 已复制到 iCloud Drive"
       rm "/tmp/$NAME.zip"
     else
       echo "❌ $NAME.zip 复制失败（可能没有 iCloud Drive 写入权限）"
       FAILED_ITEMS+=("$NAME")
     fi
   done
   ```
   如果 `$FAILED_ITEMS` 为空，跳到第 5 步验证。否则执行第 4 步 fallback。

4. **通过 Finder 写入 iCloud Drive（沙盒 fallback）**
   ```bash
   # 生成 .command 脚本，包含所有失败的项
   TMP_SCRIPT="/tmp/copy_configs.command"
   cat > "$TMP_SCRIPT" << SCRIPT
   #!/bin/bash
   TARGET="$TARGET_DIR"
   mkdir -p "\$TARGET"
   SCRIPT
   
   for NAME in "${FAILED_ITEMS[@]}"; do
     cat >> "$TMP_SCRIPT" << SCRIPT
   if cp "/tmp/$NAME.zip" "\$TARGET/$NAME.zip"; then
     echo "✅ $NAME.zip 已复制"
     rm "/tmp/$NAME.zip"
   else
     echo "❌ $NAME.zip 复制失败"
   fi
   SCRIPT
   done
   
   cat >> "$TMP_SCRIPT" << 'SCRIPT'
   echo "---"
   echo "全部完成"
   rm /tmp/copy_configs.command 2>/dev/null
   osascript -e 'display notification "配置已备份到 iCloud Drive" with title "备份完成"'
   SCRIPT
   
   chmod +x "$TMP_SCRIPT"
   open /tmp/
   echo "⚠️ 已打开 /tmp 目录，请双击运行「copy_configs.command」完成复制"
   ```

5. **验证结果**
   如果全部通过直接复制（方法 1）：
   ```bash
   echo "✅ 全部备份成功 — iCloud Drive"
   for item in "${ITEMS[@]}"; do
     NAME="${item##*|}"
     pkg="$TARGET_DIR/$NAME.zip"
     if [ -f "$pkg" ]; then
       echo "$(ls -lh "$pkg" | tr -s ' ' | cut -d' ' -f5)  $NAME.zip"
     fi
   done
   echo "---"
   for item in "${ITEMS[@]}"; do
     NAME="${item##*|}"
     pkg="$TARGET_DIR/$NAME.zip"
     echo "📄 $NAME.zip 内容:"
     unzip -l "$pkg" 2>/dev/null | tail -5 | head -2
     echo ""
   done
   ```
   如果走了 fallback 路径（第 4 步）：
   ```bash
   echo "⚠️ 沙盒环境下无法直接写入 iCloud Drive"
   echo "打包就绪:"
   for item in "${ITEMS[@]}"; do
     NAME="${item##*|}"
     zip="/tmp/$NAME.zip"
     if [ -f "$zip" ]; then
       echo "  $(ls -lh "$zip" | tr -s ' ' | cut -d' ' -f5)  $NAME.zip"
     fi
   done
   echo "请双击 Finder 窗口中的「copy_configs.command」完成复制"
   ```
