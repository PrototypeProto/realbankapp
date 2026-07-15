# make testing sub-profiles using pytest.mark.{PROFILE_IDENTIFIER}
## name identifiers in pyproject.toml in `markers = []`

You can chain many profile identifiers if `pytestmark` is named within the `.py` file and listed the various identifiers

can run a single profile:
- `uv run pytest -m {IDENTIFIER} -v`

or all at once:
- `uv run pytest -v`