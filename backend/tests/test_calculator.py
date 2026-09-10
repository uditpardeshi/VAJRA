import pytest
from app.core.agent_tools import calculator

@pytest.mark.asyncio
async def test_calculator_safe_evaluation():
    # 1. Valid arithmetic
    res = await calculator("3.5 - 2.8")
    assert "result" in res
    assert abs(res["result"] - 0.7) < 1e-4

    # 2. Allowed constant (pi)
    res = await calculator("pi * 2")
    assert "result" in res
    assert abs(res["result"] - 6.28318) < 1e-4

    # 3. Security block: builtin function abs
    res = await calculator("abs(-1)")
    assert "error" in res

    # 4. Security block: malicious code injection
    res = await calculator("__import__('os').system('dir')")
    assert "error" in res
