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

        // Add separate Date and Time headers
        const headers = [
            { label: "Date", key: "entry_date_only" }, 
            { label: "Time", key: "entry_time_only" },
            ...columnHeaders
        ];

        // Fetch entries dynamically
        let entries = await getEntriesForTab(selectedProject, selectedTab, email);

        // **Filter out deleted entries**
        entries = entries.filter(entry => !entry.deleted || entry.deleted === false);

        // **Sort entries in descending order (newest first)**
        entries.sort((a, b) => {
            const dateA = new Date(a.entry_date);
            const dateB = new Date(b.entry_date);
            return dateB - dateA; // Newest to oldest
        });

        // Function to properly extract Firebase date & time with correct timezone
        const extractDateTime = (entry_date) => {
            if (!entry_date) return { date: "N/A", time: "N/A" };

            let dateObj;
            if (typeof entry_date === "string") {
                dateObj = new Date(entry_date);
            } else if (entry_date.toDate) {
                dateObj = entry_date.toDate(); // Handle Firestore Timestamp
            } else {
                dateObj = new Date(entry_date);
            }

            if (isNaN(dateObj)) return { date: "N/A", time: "N/A" };

            // Convert to local time (same as Firebase stored format)
            const localDate = dateObj.toLocaleDateString("en-US"); // Format: MM/DD/YYYY
            const localTime = dateObj.toLocaleTimeString("en-US", { hour12: false }); // Format: HH:MM:SS

            return {
                date: localDate, // Ensure the date is correct
                time: localTime  // Ensure time is correct
            };
        };

        const formattedData = entries.map(entry => {
            const { date, time } = extractDateTime(entry.entry_date);

            let formattedEntry = {
                entry_date_only: date,
                entry_time_only: time
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
