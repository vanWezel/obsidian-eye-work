import { TFile, Vault } from "obsidian";
import { Gitlab } from "./api";
import { Notes } from "notes/notes";

export class GitlabNotes {
	private api: Gitlab;
	notes: Notes;

	constructor(gitlab: Gitlab, vault: Vault, location: string) {
		this.notes = new Notes(vault, location);
		this.api = gitlab;
	}

	private async appendMrNote(file: TFile, mr: MergeRequest) {
		const footer = [
			`[View](${mr.web_url})`,
			`\`${mr.source_branch}\``,
			`💭 ${mr.user_notes_count}`,
			`(${mr.detailed_merge_status})`,
		];

		const data = `>${mr.title} \n ${footer.join(" | ")} \n\n`;
		console.log("writing", data);

		await this.notes.appendToFile(file, data);
	}

	async saveReviewRequest() {
		const requests = (await this.api.fetchReviewRequests())
			.sort((r) => r.project_id)
			.filter((mr) => mr.draft === false);

		const file = await this.notes.newFile("Gitlab - Review Requests");
		await requests.map(async (mr) => this.appendMrNote(file, mr));
	}

	async saveMergeRequest() {
		const requests = (await this.api.fetchMergeRequests()).sort(
			(r) => r.project_id
		);

		const file = await this.notes.newFile("Gitlab - Merge Requests");
		await requests.map(async (mr) => this.appendMrNote(file, mr));
	}
}
