import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTableProps<T> {
    data: T[];
    searchKeys: (keyof T | string)[];
    searchPlaceholder?: string;
    children: (paginatedData: T[]) => React.ReactNode;
    perPageOptions?: number[];
    defaultPerPage?: number;
}

function getNestedValue(obj: any, path: string): string {
    const value = path.split('.').reduce((acc, key) => acc?.[key], obj);
    return value != null ? String(value) : '';
}

export default function DataTable<T>({
    data,
    searchKeys,
    searchPlaceholder = 'Rechercher...',
    children,
    perPageOptions = [10, 25, 50],
    defaultPerPage = 10,
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = useState('');
    const [perPage, setPerPage] = useState(defaultPerPage);
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return data;
        return data.filter((item) =>
            searchKeys.some((key) => {
                const val = getNestedValue(item, key as string);
                return val.toLowerCase().includes(q);
            })
        );
    }, [data, searchQuery, searchKeys]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));

    // Reset to page 1 when search or perPage changes
    const safePage = currentPage > totalPages ? 1 : currentPage;
    if (safePage !== currentPage) setCurrentPage(safePage);

    const paginatedData = useMemo(() => {
        const start = (safePage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, safePage, perPage]);

    const from = filteredData.length === 0 ? 0 : (safePage - 1) * perPage + 1;
    const to = Math.min(safePage * perPage, filteredData.length);

    // Page numbers to display (max 5)
    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        let start = Math.max(1, safePage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }, [safePage, totalPages]);

    return (
        <div className="space-y-3">
            {/* Top bar: search + per-page selector */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder={searchPlaceholder}
                        className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Afficher</span>
                    <select
                        value={perPage}
                        onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
                    >
                        {perPageOptions.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    <span>par page</span>
                </div>
            </div>

            {/* Content (children render prop) */}
            {children(paginatedData)}

            {/* Bottom bar: count + pagination */}
            {filteredData.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">
                        {from}–{to} sur {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''}
                        {filteredData.length !== data.length && ` (${data.length} au total)`}
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={safePage === 1}
                                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(safePage - 1)}
                                disabled={safePage === 1}
                                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {pageNumbers.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setCurrentPage(p)}
                                    className={`min-w-[2rem] h-8 rounded-lg text-xs font-medium transition-colors ${
                                        p === safePage
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(safePage + 1)}
                                disabled={safePage === totalPages}
                                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={safePage === totalPages}
                                className="p-1.5 rounded-lg hover:bg-surface-hover text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
