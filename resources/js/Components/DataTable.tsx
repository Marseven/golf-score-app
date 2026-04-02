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

    const safePage = currentPage > totalPages ? 1 : currentPage;
    if (safePage !== currentPage) setCurrentPage(safePage);

    const paginatedData = useMemo(() => {
        const start = (safePage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [filteredData, safePage, perPage]);

    const from = filteredData.length === 0 ? 0 : (safePage - 1) * perPage + 1;
    const to = Math.min(safePage * perPage, filteredData.length);

    const pageNumbers = useMemo(() => {
        const pages: number[] = [];
        let start = Math.max(1, safePage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    }, [safePage, totalPages]);

    return (
        <div className="space-y-4">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        placeholder={searchPlaceholder}
                        className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                </div>
                <div className="flex items-center gap-1.5">
                    {perPageOptions.map((n) => (
                        <button
                            key={n}
                            onClick={() => { setPerPage(n); setCurrentPage(1); }}
                            className={`min-w-[36px] h-9 rounded-xl text-xs font-semibold transition-all ${
                                perPage === n
                                    ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                                    : 'bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                            }`}
                        >
                            {n}
                        </button>
                    ))}
                    <span className="text-[10px] text-muted-foreground/50 ml-1 hidden sm:inline">/ page</span>
                </div>
            </div>

            {/* Content */}
            {children(paginatedData)}

            {/* Bottom bar */}
            {filteredData.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground/70">
                        <span className="font-semibold text-foreground">{from}–{to}</span> sur {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''}
                        {filteredData.length !== data.length && <span className="text-muted-foreground/40"> ({data.length} au total)</span>}
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1 bg-surface/50 p-1 rounded-xl border border-border/50">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={safePage === 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(safePage - 1)}
                                disabled={safePage === 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex items-center gap-0.5 mx-1">
                                {pageNumbers.map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${
                                            p === safePage
                                                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                                                : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(safePage + 1)}
                                disabled={safePage === totalPages}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={safePage === totalPages}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-hover text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronsRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
