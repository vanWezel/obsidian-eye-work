import { Gitlab } from "notes/gitlab/api";
import { GitlabNotes } from "notes/gitlab/notes";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

interface EyeWorkPluginSettings {
	gitlab_token: string;
	gitlab_username: string;
	folder_location: string;
	interval_sync: number;
}

const DEFAULT_SETTINGS: EyeWorkPluginSettings = {
	gitlab_token: "",
	gitlab_username: "",
	folder_location: "💼 Eye/Dashboard",
	interval_sync: 15,
};

export default class EyeWorkPlugin extends Plugin {
	settings: EyeWorkPluginSettings;

	async onload() {
		await this.loadSettings();

		const gitlabApi = new Gitlab(
			this.settings.gitlab_token,
			this.settings.gitlab_username
		);

		const gitlabNotes = new GitlabNotes(
			gitlabApi,
			this.app.vault,
			this.settings.folder_location
		);

		const updateGitlab = async () => {
			new Notice("Updating GitLab...");
			await gitlabNotes.saveReviewRequest();
			await gitlabNotes.saveMergeRequest();
			new Notice("GitLab updated.");
		};

		this.addRibbonIcon("bot", "Update Work Data", (evt: MouseEvent) => {
			updateGitlab();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-eye-modal-simple",
			name: "Open eye modal (simple)",
			callback: () => {
				new eyeModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "eye-editor-command",
			name: "eye editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("eye Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-eye-modal-complex",
			name: "Open eye modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new eyeModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// register our update interval
		this.registerInterval(
			window.setInterval(() => {
				updateGitlab();
			}, 1000 * 60 * this.settings.interval_sync)
		);
		updateGitlab();
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class eyeModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SettingTab extends PluginSettingTab {
	plugin: EyeWorkPlugin;

	constructor(app: App, plugin: EyeWorkPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Save location")
			.setDesc("Where do you want to save the generated files?")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.folder_location)
					.onChange(async (value) => {
						this.plugin.settings.folder_location = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Sync interval")
			.setDesc("How often do you want to sync? In minutes")
			.addText((text) =>
				text
					.setValue(`${this.plugin.settings.interval_sync}`)
					.onChange(async (value) => {
						this.plugin.settings.interval_sync = parseInt(value);
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Gitlab: Access Token")
			.setDesc(
				"Go to: https://gitlab.com/-/user_settings/personal_access_tokens -> create new token with scopes: `read_api` + `read_repository`"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your access token")
					.setValue(this.plugin.settings.gitlab_token)
					.onChange(async (value) => {
						this.plugin.settings.gitlab_token = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl).setName("Gitlab: Username").addText((text) =>
			text
				.setPlaceholder("Enter your username")
				.setValue(this.plugin.settings.gitlab_username)
				.onChange(async (value) => {
					this.plugin.settings.gitlab_username = value;
					await this.plugin.saveSettings();
				})
		);
	}
}
