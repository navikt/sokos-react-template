import { BodyLong, Heading, Table } from "@navikt/ds-react";
import type { Employee } from "../types/Employee";
import styles from "./TemplatePage.module.css";

export default function TemplatePage() {
	// Marker ut denne for at kallet går mot Mock Service Worker
	/*   const { data, isLoading } = useGetEmployee();

  if (isLoading) {
    return (
      <div className={styles.loader}>
        <Loader size="3xlarge" title="Henter data..." />
      </div>
    );
  } */

	const data = [
		{ id: 1, name: "Ola Nordmann", profession: "Lærer" },
		{ id: 2, name: "Kari Nordmann", profession: "Sykepleier" },
		{ id: 3, name: "Per Hansen", profession: "Elektriker" },
	];

	return (
		<>
			<div className={styles["template-header"]}>
				<Heading spacing level="1" size="large">
					React grensesnittmal for Utbetalingsportalen
				</Heading>
				<BodyLong>
					Dette er en mal for å bygge mikrofrontend i Utbetalingsportalen
				</BodyLong>
			</div>

			<div className={styles["template-body"]}>
				<Heading spacing level="2" size="medium">
					Ansatte
				</Heading>

				<Table>
					<Table.Header>
						<Table.Row>
							<Table.HeaderCell scope="col">Id</Table.HeaderCell>
							<Table.HeaderCell scope="col">Navn</Table.HeaderCell>
							<Table.HeaderCell scope="col">Yrke</Table.HeaderCell>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{data?.map((employee: Employee) => {
							return (
								<Table.Row key={employee.id}>
									<Table.HeaderCell scope="row">{employee.id}</Table.HeaderCell>
									<Table.DataCell>{employee.name}</Table.DataCell>
									<Table.DataCell>{employee.profession}</Table.DataCell>
								</Table.Row>
							);
						})}
					</Table.Body>
				</Table>
			</div>
		</>
	);
}
