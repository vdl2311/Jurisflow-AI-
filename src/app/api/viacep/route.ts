import { NextRequest, NextResponse } from 'next/server'

// GET /api/viacep?cep=00000000 - Integração ViaCEP
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cep = (searchParams.get('cep') || '').replace(/\D/g, '')

  if (!cep || cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido. Use 8 dígitos.' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!res.ok) throw new Error('Falha na consulta')
    const data = await res.json()

    if (data.erro) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      cep: data.cep,
      logradouro: data.logradouro,
      complemento: data.complemento,
      bairro: data.bairro,
      localidade: data.localidade, // cidade
      uf: data.uf,
      ibge: data.ibge,
      // Endereço formatado pronto para preencher campo
      enderecoCompleto: `${data.logradouro || ''}${data.complemento ? ' - ' + data.complemento : ''} - ${data.bairro || ''}, ${data.localidade}/${data.uf}`.trim(),
    })
  } catch (error) {
    console.error('ViaCEP error:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar ViaCEP. Tente novamente.' },
      { status: 500 }
    )
  }
}
