interface MergeRequest {
	title: string;
	description: string;
	user_notes_count: number;
	source_branch: string;
	state: string;
	web_url: string;
	detailed_merge_status: string;
	project_id: number;
	draft: boolean;
}