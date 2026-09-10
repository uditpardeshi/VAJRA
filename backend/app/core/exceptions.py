class ModelUnavailableError(Exception):
    """Raised when vision/text model is unreachable or returns invalid response."""
    def __init__(self, reason: str, original_error: Exception | None = None):
        self.reason = reason
        self.original_error = original_error
        super().__init__(f"Model unavailable: {reason}")
