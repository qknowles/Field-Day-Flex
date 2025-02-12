import { getColumnsCollection, getEntriesForTab } from '../utils/firestore';

export const generateCSVData = async (selectedProject, selectedTab, email) => {
    if (!selectedProject || !selectedTab) {
        console.error("Project or Tab not selected");
        return { headers: [], data: [] };
    }

    try {
        // Fetch columns dynamically
        let columns = await getColumnsCollection(selectedProject, selectedTab, email);

        // Ensure columns are sorted by the 'order' field
        columns.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const columnHeaders = columns.map(col => ({
            label: col.name ? String(col.name) : "Unknown Column",
            key: col.name ? String(col.name) : "Unknown_Column"
        }));

        const headers = [{ label: "Date & Time", key: "entry_date" }, ...columnHeaders];

        // Fetch entries dynamically
        let entries = await getEntriesForTab(selectedProject, selectedTab, email);

        //**Filter out deleted entries**
        entries = entries.filter(entry => !entry.deleted || entry.deleted === false);

        const formattedData = entries.map(entry => {
            let formattedEntry = {
                entry_date: entry.entry_date?.toISOString?.() || "N/A"  
            };

            columns.forEach(col => {
                let value = entry.entry_data?.[col.name];

                if (value === undefined || value === null) {
                    formattedEntry[col.name] = "N/A";
                } else if (typeof value === "object" && value.toDate) {
                    formattedEntry[col.name] = value.toDate().toISOString(); 
                } else {
                    formattedEntry[col.name] = String(value); 
                }
            });

            return formattedEntry;
        });

        return { headers, data: formattedData };
    } catch (error) {
        console.error("Error generating CSV:", error);
        return { headers: [], data: [] };
    }
};
