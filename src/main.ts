import { App, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, TFolder, Vault, debounce } from 'obsidian';

// === 设置接口 ===
interface GraphLinkerSettings {
	mapFolderName: string;
	prefix: string;
	autoUpdate: boolean;
}

const DEFAULT_SETTINGS: GraphLinkerSettings = {
	mapFolderName: '_GraphMaps',
	prefix: 'Map_',
	autoUpdate: true
}

export default class FolderGraphPlugin extends Plugin {
	settings: GraphLinkerSettings;

	// 防抖：延迟 2 秒执行
	debouncedGenerate = debounce(this.generateGraphMap.bind(this), 2000, true);

	async onload() {
		await this.loadSettings();

		// 命令：强制重建
		this.addCommand({
			id: 'rebuild-graph-map',
			name: 'Force rebuild (强制重建影子图谱)',
			callback: () => {
				this.generateGraphMap().catch((err) => console.error(err));
			}
		});

		// 设置面板
		this.addSettingTab(new GraphLinkerSettingTab(this.app, this));

		// 启动自动监听
		if (this.settings.autoUpdate) {
			this.setupEventListeners();
		}
	}

	setupEventListeners() {
		this.registerEvent(this.app.vault.on('create', (file) => this.handleFileChange(file)));
		this.registerEvent(this.app.vault.on('delete', (file) => this.handleFileChange(file)));
		this.registerEvent(this.app.vault.on('rename', (file) => this.handleFileChange(file)));
	}

	handleFileChange(file: TAbstractFile) {
		if (!this.settings.autoUpdate) return;

		// 核心过滤：不理会影子文件夹内的变动
		if (file.path.includes(this.settings.mapFolderName)) return;

		// 只响应 Markdown 或文件夹
		if (file instanceof TFile && file.extension !== 'md') return;

		this.debouncedGenerate();
	}

	async generateGraphMap() {
		const vault = this.app.vault;
		const { mapFolderName } = this.settings;

		let mapFolder = vault.getAbstractFileByPath(mapFolderName);
		if (!mapFolder) {
			await vault.createFolder(mapFolderName);
		}

		await this.processFolder(vault.getRoot(), vault);
	}

	async processFolder(folder: TFolder, vault: Vault) {
		const { mapFolderName, prefix } = this.settings;
		let links: string[] = [];

		const children = folder.children ? folder.children.sort((a, b) => a.name.localeCompare(b.name)) : [];

		for (const child of children) {
			if (child instanceof TFolder) {
				if (child.name === mapFolderName) continue;

				await this.processFolder(child, vault);

				const childMapName = `${prefix}${this.cleanPath(child.path)}`;
				links.push(`- [[${childMapName}|📂 ${child.name}]]`);

			} else if (child instanceof TFile) {
				if (child.extension === 'md' && !child.path.includes(mapFolderName)) {
					links.push(`- [[${child.path}|📄 ${child.basename}]]`);
				}
			}
		}

		if (links.length === 0) return;

		const mapFileName = `${prefix}${this.cleanPath(folder.path)}.md`;
		const mapFilePath = `${mapFolderName}/${mapFileName}`;

		const content = `---
tags: [auto-graph-map]
---
# 🗺️ 架构图: ${folder.name}\n
${links.join("\n")}
`;

		const targetFile = vault.getAbstractFileByPath(mapFilePath);
		if (targetFile instanceof TFile) {
			const oldContent = await vault.read(targetFile);
			if (oldContent !== content) {
				await vault.modify(targetFile, content);
			}
		} else if (!targetFile && folder.path !== '/') {
			await vault.create(mapFilePath, content);
		}
	}

	cleanPath(path: string): string {
		if (path === '/') return 'ROOT';
		return path.replace(/\//g, "_").replace(/\\/g, "_").replace(/\s/g, "-");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as GraphLinkerSettings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// === 设置面板 UI ===
class GraphLinkerSettingTab extends PluginSettingTab {
	plugin: FolderGraphPlugin;

	constructor(app: App, plugin: FolderGraphPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();


		// 1. 自动更新开关
		new Setting(containerEl)
			.setName('启用自动更新')
			.setDesc('文件变动 2 秒后自动刷新图谱 (需要重启 Obsidian 生效)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoUpdate)
				.onChange(async (value) => {
					this.plugin.settings.autoUpdate = value;
					await this.plugin.saveSettings();
				}));

		// 2. 文件夹名称设置
		new Setting(containerEl)
			.setName('影子文件夹名称')
			.setDesc('存放索引文件的目录')
			.addText(text => text
				// eslint-disable-next-line obsidianmd/ui/sentence-case
				.setPlaceholder('_GraphMaps')
				.setValue(this.plugin.settings.mapFolderName)
				.onChange(async (value) => {
					this.plugin.settings.mapFolderName = value;
					await this.plugin.saveSettings();
				}));

		// 3. 【补回】前缀设置
		new Setting(containerEl)
			.setName('索引文件前缀')
			.setDesc('给生成的索引文件加个前缀，防止重名')
			.addText(text => text

				.setPlaceholder('Map_')
				.setValue(this.plugin.settings.prefix)
				.onChange(async (value) => {
					this.plugin.settings.prefix = value;
					await this.plugin.saveSettings();
				}));
	}
}