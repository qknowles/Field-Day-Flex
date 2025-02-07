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
            label: col.name,
            key: col.name
        }));

        const headers = [{ label: "Date & Time", key: "entry_date" }, ...columnHeaders];

        // Fetch entries dynamically
        const entries = await getEntriesForTab(selectedProject, selectedTab, email);
        const formattedData = entries.map(entry => {
            let formattedEntry = { entry_date: entry.entry_date.toISOString() };
            columns.forEach(col => {
                formattedEntry[col.name] = entry.entry_data[col.name] || "N/A";
            });
            return formattedEntry;
        });

        return { headers, data: formattedData };
    } catch (error) {
        console.error("Error generating CSV:", error);
        return { headers: [], data: [] };
    }
};
