import axios, {
	type AxiosError,
	type AxiosInstance,
	type CreateAxiosDefaults,
} from "axios";
import { ApiError, HttpStatusCodeError } from "./Error";

const config = (baseUri: string): CreateAxiosDefaults => ({
	baseURL: baseUri,
	timeout: 30000,
	withCredentials: true,
	headers: {
		Pragma: "no-cache",
		"Cache-Control": "no-cache",
		"Content-Type": "application/json",
	},
	validateStatus: (status) => status < 400,
});

// Axios-instanser caches per baseUri slik at instans og interceptor
// ikke opprettes på nytt for hvert eneste API-kall.
const instanceCache = new Map<string, AxiosInstance>();

function api(baseUri: string): AxiosInstance {
	const cachedInstance = instanceCache.get(baseUri);
	if (cachedInstance) {
		return cachedInstance;
	}

	const instance = axios.create(config(baseUri));

	instance.interceptors.response.use(
		(response) => response,
		(error: AxiosError) => {
			if (error.response?.status === 401 || error.response?.status === 403) {
				// Uinnlogget - vil ikke skje i miljø da appen er beskyttet
				return Promise.reject(error);
			}
			if (error.response?.status === 400) {
				throw new HttpStatusCodeError(
					400,
					(error.response.data as { message?: string })?.message ||
						"Ugyldig forespørsel. Hvis feilen vedvarer, meld sak i Porten.",
				);
			}
			throw new ApiError(
				(error.response?.data as { message?: string })?.message ||
					"Noe gikk galt. Hvis feilen vedvarer, meld sak i Porten.",
			);
		},
	);

	instanceCache.set(baseUri, instance);
	return instance;
}

export async function axiosFetcher<T>(
	baseUri: string,
	url: string,
): Promise<T> {
	const res = await api(baseUri).get<T>(url);
	return res.data;
}

export async function axiosPostFetcher<T, U>(
	baseUri: string,
	url: string,
	body?: T,
): Promise<U> {
	const res = await api(baseUri).post<U>(url, body);
	return res.data;
}
