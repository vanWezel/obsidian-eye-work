import axios, { Axios, AxiosInstance } from "axios";

export class Gitlab {
	private client: AxiosInstance;
	private username: string;

	constructor(token: string, username: string) {
		this.client = axios.create({
			baseURL: "https://gitlab.com/api/v4",
			headers: { "PRIVATE-TOKEN": token },
		});

		this.username = username;
	}

	private fetch<Response>(endpoint: string) {
		return this.client.get<Response>(endpoint);
	}

	fetchMergeRequests() {
		return new Promise<MergeRequest[]>((resolve) => {
			console.log(`fetching open merge requests for ${this.username}`);
			return this.fetch<MergeRequest[]>(
				`/merge_requests?state=opened&scope=assigned_to_me`
			).then((r) => resolve(r.data));
		});
	}

	fetchReviewRequests() {
		return new Promise<MergeRequest[]>((resolve) => {
			console.log(`fetching review requests for ${this.username}`);
			return this.fetch<MergeRequest[]>(
				`/merge_requests?reviewer_username=${this.username}`
			).then((r) => resolve(r.data));
		});
	}
}
