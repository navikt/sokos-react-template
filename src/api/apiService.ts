import useSWRImmutable from "swr/immutable";
import type { EmployeeList } from "../types/Employee";
import { axiosFetcher } from "./config/apiConfig";

const BASE_URI = {
	BACKEND_API: "/mikrofrontend-api/api/v1",
};

function swrConfig<T>(fetcher: (uri: string) => Promise<T>) {
	return {
		fetcher,
		suspense: true,
		revalidateOnFocus: false,
		refreshInterval: 600000,
	};
}

export function useGetEmployee() {
	const { data, error, isValidating } = useSWRImmutable<EmployeeList>(
		`/employee`,
		swrConfig<EmployeeList>((url) =>
			axiosFetcher<EmployeeList>(BASE_URI.BACKEND_API, url),
		),
	);
	const isLoading = (!error && !data) || isValidating;

	return { data, error, isLoading };
}
