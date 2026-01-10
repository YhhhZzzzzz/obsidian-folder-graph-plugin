# Folder Graph (Shadow Linker)

**Connect your folders in Graph View without the clutter.**

Are your Obsidian folders full of notes, but your Graph View looks like a bunch of disconnected islands? 
Most "Folder Note" plugins solve this by forcing you to create an `_Index.md` file inside *every single folder*, which messes up your file list.

**Folder Graph** solves this differently. It uses a **Shadow Indexing** system.

### ✨ Key Features

* **Zero Intrusion:** It mirrors your folder structure into a separate `_GraphMaps` folder. Your actual note directories remain 100% clean.
* **Beautiful Hierarchy:** Turns your flat graph into a structured, multi-level "Hub & Spoke" visualization (Directory -> Sub-directory -> Notes).
* **Auto-Update:** Automatically detects file creation, deletion, and renaming. Just write your notes, and the graph updates itself in the background (with debounce to save performance).
* **Fully Customizable:** Change the storage folder name or the map file prefix to suit your workflow.

### 📸 How it works

1.  You write notes in your normal folders (e.g., `Daily/2025/07/23.md`).
2.  The plugin automatically generates a shadow map in `_GraphMaps/Map_Daily_2025_07.md`.
3.  **Result:** Your Graph View is perfectly connected, but your file explorer stays tidy.

### ⚙️ Usage

1.  Install and enable the plugin.
2.  (Optional) Go to settings to customize the "Shadow Folder Name".
3.  The plugin will automatically start mapping your vault.
4.  You can also force a rebuild via the Command Palette: `Folder Graph: Force Rebuild`.

---
*Created to solve the pain of "Orphaned Nodes" in Obsidian.*