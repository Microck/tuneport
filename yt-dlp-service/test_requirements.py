import unittest
from pathlib import Path


class TestRequirements(unittest.TestCase):
    def test_mutagen_listed(self):
        requirements = Path(__file__).resolve().parent / 'requirements.txt'
        content = requirements.read_text(encoding='utf-8')
        self.assertIn('mutagen', content)


if __name__ == '__main__':
    unittest.main()
