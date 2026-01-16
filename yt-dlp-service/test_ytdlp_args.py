import unittest

from app import build_ytdlp_args


class TestYtDlpArgs(unittest.TestCase):
    def test_build_args_without_segments(self):
        args = build_ytdlp_args('https://youtube.com/watch?v=test', 'opus', '/data/abc', None, None, None)
        self.assertIn('--output', args)
        self.assertIn('/data/abc.%(ext)s', args)
        self.assertNotIn('--download-sections', args)
        self.assertIn('--convert-thumbnails', args)
        self.assertIn('-f', args)
        self.assertTrue(any('251' in arg for arg in args))
        self.assertIn('--extract-audio', args)
        self.assertIn('--audio-format', args)
        self.assertNotIn('--postprocessor-args', args)

    def test_build_args_m4a(self):
        args = build_ytdlp_args('https://youtube.com/watch?v=test', 'm4a', '/data/abc', None, None, None)
        self.assertTrue(any('140' in arg for arg in args))
        self.assertIn('m4a', args)


    def test_build_args_with_segments(self):
        segments = [
            {'start': 0, 'end': 10, 'title': 'intro'},
            {'start': 12, 'end': None, 'title': 'outro'}
        ]
        args = build_ytdlp_args('https://youtube.com/watch?v=test', 'mp3', '/data/abc', segments, None, None)
        self.assertIn('--download-sections', args)
        self.assertIn('*0:00-0:10', args)
        self.assertIn('*0:12-', args)
        self.assertIn('--force-keyframes-at-cuts', args)
        self.assertIn('/data/abc.%(section_start)s-%(section_end)s.%(ext)s', args)

    def test_build_args_with_metadata(self):
        args = build_ytdlp_args('https://youtube.com/watch?v=test', 'mp3', '/data/abc', None, 'Song', 'Artist')
        self.assertIn('--postprocessor-args', args)
        self.assertTrue(any(arg.startswith('ffmpeg:') for arg in args))


if __name__ == '__main__':
    unittest.main()
