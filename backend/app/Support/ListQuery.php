<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Collection;

final class ListQuery
{
    private array $values;

    public function __construct(Request $request)
    {
        $this->values = Validator::make($request->query(), [
            'page' => ['sometimes', 'integer', 'min:1'], 'per_page' => ['sometimes', 'integer', 'between:1,100'],
            'search' => ['sometimes', 'nullable', 'string', 'max:200'], 'sort' => ['sometimes', 'nullable', 'string', 'max:200'],
        ])->validate();
    }

    /** Column names are static controller/service mappings, never request SQL. */
    public function paginate(Builder $query, array $columns, string $defaultSort = 'id', ?array $searchColumns = null): LengthAwarePaginator
    {
        $sorts = explode(',', ($this->values['sort'] ?? '') ?: $defaultSort);
        foreach ($sorts as $sort) {
            $key = str_starts_with($sort, '-') ? substr($sort, 1) : $sort;
            if (!isset($columns[$key])) {
                throw ValidationException::withMessages(['sort' => __('validation.sort')]);
            }
            $query->orderBy($columns[$key], str_starts_with($sort, '-') ? 'desc' : 'asc');
        }
        $search = mb_strtolower(trim(Digits::normalize($this->values['search'] ?? '')));
        if ($search !== '') {
            // Escape LIKE wildcards; values still use PDO bindings. ! works on MySQL and SQLite.
            $pattern = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%';
            $grammar = $query->getQuery()->getGrammar();
            $query->where(function (Builder $where) use ($searchColumns, $columns, $pattern, $grammar) {
                foreach ($searchColumns ?? array_values($columns) as $column) {
                    $where->orWhereRaw('LOWER('.$grammar->wrap($column).") LIKE ? ESCAPE '!'", [$pattern]);
                }
            });
        }
        if (isset($columns['id'])) $query->orderBy($columns['id']);
        return $query->paginate((int) ($this->values['per_page'] ?? 20), ['*'], 'page', (int) ($this->values['page'] ?? 1));
    }

    /** DTO feeds share validation, search, ordering and pagination with SQL lists. */
    public function collection(Collection $rows, array $columns, string $defaultSort = '', ?array $searchColumns = null): LengthAwarePaginator
    {
        $sort = ($this->values['sort'] ?? '') ?: $defaultSort;
        $sorts = $sort === '' ? [] : explode(',', $sort);
        foreach ($sorts as $field) {
            if (!in_array(str_starts_with($field, '-') ? substr($field, 1) : $field, $columns, true)) throw ValidationException::withMessages(['sort' => __('validation.sort')]);
        }
        $search = mb_strtolower(trim(Digits::normalize($this->values['search'] ?? '')));
        $value = static function ($row, $key) {
            $v = data_get($row, $key);
            if (is_array($v)) $v = $v[app()->getLocale()] ?? implode(' ', $v);
            return is_string($v) ? mb_strtolower($v) : $v;
        };
        if ($search !== '') $rows = $rows->filter(function ($row) use ($search, $searchColumns, $columns, $value) {
            foreach ($searchColumns ?? $columns as $key) if (str_contains((string) $value($row, $key), $search)) return true;
            return false;
        });
        if ($sorts) $rows = $rows->sort(function ($a, $b) use ($sorts, $value) {
            foreach ($sorts as $field) {
                $key = str_starts_with($field, '-') ? substr($field, 1) : $field;
                $cmp = $value($a, $key) <=> $value($b, $key);
                if ($cmp) return str_starts_with($field, '-') ? -$cmp : $cmp;
            }
            return 0;
        });
        $page = (int) ($this->values['page'] ?? 1); $size = (int) ($this->values['per_page'] ?? 20);
        return new LengthAwarePaginator($rows->values()->forPage($page, $size)->values(), $rows->count(), $size, $page);
    }
}
