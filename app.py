Commit message: Fix import errors and add secure_filename

Extended description:
- Remove duplicate imports (os, sys)
- Add secure_filename import from werkzeug.utils
- Use secure_filename for file upload safety
