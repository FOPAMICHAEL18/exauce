// app/test/mocks/next-server.ts

// NextRequest : simple alias de Request pour les tests
export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init)
  }
}

// NextResponse : Response avec la méthode statique .json() de Next
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
}