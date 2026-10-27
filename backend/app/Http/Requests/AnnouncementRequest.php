<?php
namespace App\Http\Requests;
use App\Enums\Permission;
class AnnouncementRequest extends StrictFormRequest
{
    public function authorize(): bool { return $this->user()->hasPermission(Permission::PostAnnouncements); }
    public function rules(): array { return ['title' => ['required', 'string', 'max:200'], 'body' => ['required', 'string', 'max:10000'], 'audience' => ['required', 'in:all,role,offering'], 'role' => ['required_if:audience,role', 'nullable', 'in:admin,teacher,student'], 'offering_id' => ['required_if:audience,offering', 'nullable', 'integer', 'min:1'], 'week_number' => ['sometimes', 'nullable', 'integer', 'between:1,16']]; }
}
