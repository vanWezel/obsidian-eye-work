import { TFile, Vault } from "obsidian";

export class Notes {
	private location: string;
	private vault: Vault;

	constructor(vault: Vault, location: string) {
		this.vault = vault;
		this.location = location;
	}

	async newFile(name: string) {
		const file = await this.getOrCreateFile(name);
		await this.emptyFile(file);
		return file;
	}

	async getOrCreateFile(name: string) {
		const fullPath = `${this.location}/${name}.md`;
		let file = await this.vault.getFileByPath(fullPath);
		if (file) {
			return file;
		}

		return await this.vault.create(fullPath, "");
	}

	async emptyFile(file: TFile) {
		this.vault.modify(file, "");
	}

	async appendToFile(file: TFile, data: string) {
		this.vault.append(file, data);
	}
}
