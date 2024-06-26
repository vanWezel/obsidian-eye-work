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
}

const DEFAULT_SETTINGS: EyeWorkPluginSettings = {
	gitlab_token: "",
	gitlab_username: "",
	folder_location: "💼 Eye/Dashboard",
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

		// This creates an icon in the left ribbon.
		this.addRibbonIcon("dice", "Sample Plugin", (evt: MouseEvent) => {
			updateGitlab();
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// // Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => {}, 1000));
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

class SampleModal extends Modal {
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
			.setName("Gitlab: Access Token")
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
