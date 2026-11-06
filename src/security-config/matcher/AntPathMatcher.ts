/**
 * Ant-style path matcher, mirroring Spring's org.springframework.util.AntPathMatcher.
 * Supports:
 * - '?' matches one character within a path segment
 * - '*' matches zero or more characters within a path segment
 * - '**' matches zero or more path segments across slashes
 */
export class AntPathMatcher {
  public static match(pattern: string, path: string): boolean {
    const cleanPath = path.split('?')[0].replace(/\/+/g, '/');
    const cleanPattern = pattern.split('?')[0].replace(/\/+/g, '/');

    if (cleanPattern === cleanPath) {
      return true;
    }

    let regexStr = '^';
    let i = 0;
    const len = cleanPattern.length;

    while (i < len) {
      const char = cleanPattern[i];

      if (char === '*' && cleanPattern[i + 1] === '*') {
        // Double star at the end, e.g., '/api/public/**'
        if (i > 0 && cleanPattern[i - 1] === '/' && i + 2 === len) {
          regexStr = regexStr.slice(0, -1); // strip previous '/'
          regexStr += '(?:/.*)?';
          i += 2;
          continue;
        } else if (i > 0 && cleanPattern[i - 1] === '/' && cleanPattern[i + 2] === '/') {
          // Double star in middle, e.g., '/api/**/resource'
          regexStr = regexStr.slice(0, -1);
          regexStr += '(?:/|/.+/)';
          i += 3;
          continue;
        } else {
          // Double star alone, e.g., '**'
          regexStr += '.*';
          i += 2;
          continue;
        }
      } else if (char === '*') {
        regexStr += '[^/]*';
        i++;
      } else if (char === '?') {
        regexStr += '[^/]';
        i++;
      } else if ('[\\](){}+.^$|'.includes(char)) {
        regexStr += '\\' + char;
        i++;
      } else {
        regexStr += char;
        i++;
      }
    }

    // Allow optional trailing slash if not already matched
    if (!regexStr.endsWith('?') && !regexStr.endsWith('.*') && !regexStr.endsWith('/')) {
      regexStr += '/?';
    }
    regexStr += '$';

    return new RegExp(regexStr).test(cleanPath);
  }
}

