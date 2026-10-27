<?php

return [
    'invalid_files' => 'Files must match the permitted content type, owner, course, purpose and upload limits.',
    'submission_closed' => 'Submissions are disabled or the deadline has passed.',
    'invalid_academic' => 'The academic data or related records are invalid.',
    'schedule_conflict' => 'The schedule overlaps another class for this instructor, room or student.',
    'capacity_exceeded' => 'The selected students exceed the offering capacity.',
    'validation' => 'Check the highlighted fields.', 'unauthenticated' => 'Your session has ended. Please sign in again.',
    'forbidden' => 'Your account does not have access to this area.', 'not_found' => 'The requested record was not found.',
    'method_not_allowed' => 'This request method is not supported.', 'error' => 'The request could not be completed.',
    'invalid_credentials' => 'The email or password is incorrect.', 'inactive' => 'This account is inactive. Contact your university administrator.',
    'password_change_required' => 'Change your administrator password before continuing.', 'current_password_invalid' => 'Your current password is incorrect.',
    'csrf' => 'Your security token has expired. Refresh the page and try again.', 'throttled' => 'Too many sign-in attempts. Try again in one minute.',
    'upload_too_large' => 'The upload exceeds the server limit. Use at most five files of 5 MiB each, or ask the administrator to raise post_max_size to 32 MB.',
    'record_in_use' => 'This record has linked academic data and cannot be removed.',
    'installed' => 'Installation complete. Sign in with the configured administrator email and change the initial password. Remove LMS_INSTALLER_TOKEN from .env.',
    'already_installed' => 'The LMS is already installed. No credentials were changed.',
    'install_failed' => 'Installation failed. Check the database connection, initial administrator settings and storage permissions.',
    'install_config_hint' => 'Use MySQL, a valid unique LMS_ADMIN_EMAIL, a mixed LMS_ADMIN_PASSWORD of 12–128 characters, and writable storage/bootstrap/cache.',
    'install_busy' => 'Another installation is running.', 'mysql_required' => 'Installation requires a MySQL connection. SQLite is for tests only.',
];
