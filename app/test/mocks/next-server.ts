// app/test/mocks/next-server.ts

export class NextRequest extends Request {
  nextUrl: {
    pathname: string
    searchParams: URLSearchParams
    href: string
  }

  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init)

    const urlString =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    const url = new URL(urlString)

    this.nextUrl = {
      pathname: url.pathname,
      searchParams: url.searchParams,
      href: url.href,
    }
  }
}

export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit): NextResponse {
    return new NextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  }

  static next(init?: { request?: { headers?: Headers } }): NextResponse {
    // Comme le vrai Next.js : une réponse 200 vide avec un header
    // sentinelle `x-middleware-next: 1` pour signaler "continue".
    const headers = new Headers({ 'x-middleware-next': '1' })

    // On expose les headers modifiés pour que les tests puissent
    // les inspecter (x-admin-data, Authorization, etc.).
    if (init?.request?.headers) {
      init.request.headers.forEach((value, key) => {
        headers.set(`x-mock-request-${key}`, value)
      })
    }

    return new NextResponse(null, { status: 200, headers })
  }
}