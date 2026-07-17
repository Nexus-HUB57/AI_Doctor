# validacao_piloto.py
import pandas as pd
from agente import AgenteOncologicoPrecisao
from validador import ValidadorProspectivo

def executar_estudo(caminho_dados_historicos):
    df = pd.read_csv(caminho_dados_historicos)
    # Divide em treino (80%) e teste (20%)
    df_hist = df.sample(frac=0.8)
    df_test = df.drop(df_hist.index)

    agente = AgenteOncologicoPrecisao(df_hist, usar_chroma=True)
    validador = ValidadorProspectivo(agente)

    resultados = []
    for _, paciente in df_test.iterrows():
        res = validador.simular_paciente(paciente.to_dict())
        resultados.append(res)

    # Relatório final
    df_res = pd.DataFrame(resultados)
    concordancia = df_res['concordancia'].mean()
    print(f"Concordância com comitê: {concordancia:.2%}")
    # Salvar resultados
    df_res.to_csv("resultados_validacao.csv", index=False)
    return df_res

if __name__ == "__main__":
    executar_estudo("dados_hospitalares.csv")
