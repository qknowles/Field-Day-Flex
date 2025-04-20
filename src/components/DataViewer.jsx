import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    forwardRef,
    useImperativeHandle
} from 'react';
import {
    getColumnsCollection,
    getEntriesForTab,
    deleteEntry,
    getEntryDetails
} from '../utils/firestore';
import { Pagination } from './Pagination';
import Button from './Button';
import WindowWrapper from '../wrappers/WindowWrapper';
import { Type, notify } from './Notifier';
import NewEntry from '../windows/NewEntry';
import { AiFillEdit, AiFillDelete } from 'react-icons/ai';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    currentUserEmail,
    currentProjectName,
    currentTableName,
    currentBatchSize,
    visibleColumnsAtom
} from '../utils/jotai';
import { searchQueryAtom, filteredEntriesAtom } from './SearchBar';
import EntryCountDisplay from './EntryCountDisplay';
import 'react-resizable/css/styles.css';

const DataViewer = forwardRef((props, ref) => {
    const SelectedProject = useAtomValue(currentProjectName);
    const SelectedTab = useAtomValue(currentTableName);
    const Email = useAtomValue(currentUserEmail);

    const [entries, setEntries] = useState([]);
    const [allEntries, setAllEntries] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [batchSize] = useAtom(currentBatchSize);
    const setCurrentProject = useSetAtom(currentProjectName);
    const setCurrentTable = useSetAtom(currentTableName);
    const [searchQuery] = useAtom(searchQueryAtom);
    const [filteredEntries, setFilteredEntries] = useAtom(filteredEntriesAtom);
    const [showEditWindow, setEditWindow] = useState(null);

    const [visibleColumns] = useAtom(visibleColumnsAtom);

    const fixedEl = document.querySelector('th.fixed-column');
    const FIXED_COLUMN_WIDTH = fixedEl
        ? fixedEl.getBoundingClientRect().width
        : 100;

    const fetchColumns = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;
        setColumns([]);
        try {
            const columnsData = await getColumnsCollection(SelectedProject, SelectedTab, Email);
            if (columnsData.length) {
                const sortedColumns = columnsData
                    .sort((a, b) => a.order - b.order)
                    .map(col => ({
                        ...col,
                        width: col.width || ((window.innerWidth - FIXED_COLUMN_WIDTH) / columnsData.length)
                    }));
                setColumns(sortedColumns);

                const orderObj = {},
                    namesObj = {},
                    typesObj = {},
                    requiredObj = {},
                    identifierObj = {},
                    optionsObj = {};
                sortedColumns.forEach((col, idx) => {
                    orderObj[col.id] = idx + 1;
                    namesObj[col.id] = col.name;
                    typesObj[col.id] = col.data_type || 'text';
                    requiredObj[col.id] = col.required_field || false;
                    identifierObj[col.id] = col.identifier_domain || false;
                    optionsObj[col.id] = col.entry_options || [];
                });
            }
        } catch (err) {
            console.error('Error fetching columns:', err);
            setError('Failed to load columns');
        }
    }, [SelectedProject, SelectedTab, Email]);

    const fetchEntries = useCallback(async () => {
        if (!SelectedProject || !SelectedTab) return;
        try {
            const raw = await getEntriesForTab(SelectedProject, SelectedTab, Email);
            const alive = raw.filter(e => !e.deleted).map(e => ({
                ...e,
                entry_data: { ...e.entry_data },
                entry_date: e.entry_date ? new Date(e.entry_date) : null
            }));

            alive.sort((a, b) => (b.entry_date || 0) - (a.entry_date || 0));
            setAllEntries(alive);
            setEntries(alive);
        } catch (err) {
            console.error('Error fetching entries:', err);
            setError('Failed to load entries');
        }
    }, [SelectedProject, SelectedTab, Email]);

    useImperativeHandle(ref, () => ({ fetchColumns, fetchEntries }));

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            setCurrentProject(SelectedProject);
            setCurrentTable(SelectedTab);
            await Promise.all([fetchColumns(), fetchEntries()]);
            if (mounted) setLoading(false);
        };
        load();
        return () => { mounted = false; };
    }, [SelectedProject, SelectedTab, fetchColumns, fetchEntries]);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredEntries(allEntries);
            setEntries(allEntries);
        } else {
            const lower = searchQuery.toLowerCase();
            const filtered = allEntries.filter(e =>
                Object.values(e.entry_data).some(val =>
                    String(val).toLowerCase().includes(lower)
                )
            );
            setFilteredEntries(filtered);
            setEntries(filtered);
        }
        setCurrentPage(1);
    }, [searchQuery, allEntries, setFilteredEntries]);

    const sortedEntries = useMemo(() => {
        if (!sortConfig.key) return entries;
        return [...entries].sort((a, b) => {
            const aVal = a.entry_data[sortConfig.key] || '';
            const bVal = b.entry_data[sortConfig.key] || '';
            if (sortConfig.key === 'entry_date') {
                return sortConfig.direction === 'asc'
                    ? (a.entry_date || 0) - (b.entry_date || 0)
                    : (b.entry_date || 0) - (a.entry_date || 0);
            }
            return sortConfig.direction === 'asc'
                ? String(aVal).localeCompare(bVal)
                : String(bVal).localeCompare(aVal);
        });
    }, [entries, sortConfig]);

    const paginatedEntries = useMemo(() => {
        const start = (currentPage - 1) * batchSize;
        return sortedEntries.slice(start, start + batchSize);
    }, [sortedEntries, currentPage, batchSize]);

    const displayedColumns = columns.filter(col =>
        visibleColumns[SelectedTab]?.[col.id] !== false
    );

    const handleSort = columnName => {
        setSortConfig(prev => ({
            key: columnName,
            direction:
                prev.key === columnName && prev.direction === 'asc'
                    ? 'desc'
                    : 'asc'
        }));
    };

    const handleEdit = async entryId => {
        try {
            const details = await getEntryDetails(Email, SelectedProject, SelectedTab, entryId);
            setEditWindow(
                <NewEntry
                    CloseNewEntry={() => setEditWindow(null)}
                    ProjectName={SelectedProject}
                    TabName={SelectedTab}
                    Email={Email}
                    existingEntry={details}
                    onEntryUpdated={() => fetchEntries()}
                />
            );
        } catch {
            notify(Type.error, 'Failed to fetch entry details');
        }
    };
    const handleDelete = async entryId => {
        if (!window.confirm('Delete this entry?')) return;
        try {
            await deleteEntry(Email, SelectedProject, SelectedTab, entryId);
            fetchEntries();
            notify(Type.success, 'Entry deleted');
        } catch {
            notify(Type.error, 'Failed to delete entry');
        }
    };

    if (loading) return <div className="p-4 text-center">Loading...</div>;
    if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

    return (
        <div className="flex-grow bg-white dark:bg-neutral-950">
            <div className="overflow-x-auto">
                <table className={displayedColumns.length === 0 ? "w-full data-table" : "w-full-table data-table"}>
                    <thead>
                        {displayedColumns.length === 0 ? (
                            <tr className="bg-neutral-100 dark:bg-neutral-800">
                                <th
                                    className="p-2 text-left border-b font-semibold"
                                    style={{ width: '100%' }}
                                >
                                    Actions
                                </th>
                            </tr>
                        ) : (
                            <tr className="bg-neutral-100 dark:bg-neutral-800">
                                <th className="p-2 text-left border-b font-semibold fixed-column">
                                    Actions
                                </th>
                                {displayedColumns.map(col => (
                                    <th
                                        key={col.id}
                                        className="p-2 text-left border-b font-semibold cursor-pointer column-border"
                                        style={{ width: col.width }}
                                        onClick={() => handleSort(col.name)}
                                    >
                                        <div className="flex items-center">
                                            {col.name}
                                            {sortConfig.key === col.name && (
                                                <span className="ml-1">
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className="react-resizable-handle"
                                            onMouseDown={e => {
                                                e.stopPropagation();
                                                const startX = e.clientX;
                                                const startW = col.width || 150;
                                                const onMove = mv => {
                                                    const newW = Math.max(50, startW + (mv.clientX - startX));
                                                    setColumns(prev =>
                                                        prev.map(c =>
                                                            c.id === col.id ? { ...c, width: newW } : c
                                                        )
                                                    );
                                                };
                                                const onUp = () => {
                                                    document.removeEventListener('mousemove', onMove);
                                                    document.removeEventListener('mouseup', onUp);
                                                };
                                                document.addEventListener('mousemove', onMove);
                                                document.addEventListener('mouseup', onUp);
                                            }}
                                        />
                                    </th>
                                ))}
                            </tr>
                        )}
                    </thead>

                    <tbody>
                        {paginatedEntries.length > 0 ? (
                            paginatedEntries.map(entry => (
                                <tr
                                    key={entry.id}
                                    className="hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {displayedColumns.length === 0 ? (
                                        <td
                                            className="p-2 border-b text-left"
                                            style={{ width: '100%' }}
                                        >
                                            <div className="flex space-x-2">
                                                <Button
                                                    onClick={() => handleEdit(entry.id)}
                                                    icon={AiFillEdit}
                                                    flexible
                                                    className="flex items-center justify-center"
                                                />
                                                <Button
                                                    onClick={() => handleDelete(entry.id)}
                                                    icon={AiFillDelete}
                                                    flexible
                                                    className="flex items-center justify-center"
                                                />
                                            </div>
                                        </td>
                                    ) : (
                                        <>
                                            <td className="p-2 border-b fixed-column">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        onClick={() => handleEdit(entry.id)}
                                                        icon={AiFillEdit}
                                                        flexible
                                                        className="flex items-center justify-center"
                                                    />
                                                    <Button
                                                        onClick={() => handleDelete(entry.id)}
                                                        icon={AiFillDelete}
                                                        flexible
                                                        className="flex items-center justify-center"
                                                    />
                                                </div>
                                            </td>
                                            {displayedColumns.map(col => (
                                                <td
                                                    key={`${entry.id}-${col.id}`}
                                                    className={`p-2 border-b text-left ${col.type === 'identifier' ? 'min-w-[150px]' : ''
                                                        }`}
                                                >
                                                    {entry.entry_data[col.name] ?? 'N/A'}
                                                </td>
                                            ))}
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={displayedColumns.length + 1}
                                    className="p-4 text-center text-neutral-500"
                                >
                                    {searchQuery
                                        ? 'No entries match your search criteria.'
                                        : 'No entries found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showEditWindow && (
                <WindowWrapper header="Edit Entry" onLeftButton={() => setEditWindow(null)} leftButtonText="Close">
                    {showEditWindow}
                </WindowWrapper>
            )}

            <div className="px-5 py-3 flex justify-between items-center">
                <EntryCountDisplay
                    currentPageCount={paginatedEntries.length}
                    totalFilteredCount={filteredEntries.length}
                    totalCount={allEntries.length}
                    isFiltered={!!searchQuery}
                />
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredEntries.length / batchSize)}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
});

export default DataViewer;
