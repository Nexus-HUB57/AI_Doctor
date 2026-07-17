# audit.py
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class DecisaoClinica(Base):
    __tablename__ = 'decisoes'
    id = Column(Integer, primary_key=True)
    patient_id = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)
    acao = Column(String(50))
    dose = Column(Float)
    linha_terapeutica = Column(Integer)
    ecog = Column(Integer)
    eficacia = Column(Float)
    estado_atual = Column(String(100))
    relatorio = Column(String(1000))

class Auditor:
    def __init__(self, db_url='sqlite:///audit.db'):
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def registrar_decisao(self, agente, acao, confianca, relatorio):
        sessao = self.Session()
        registro = DecisaoClinica(
            patient_id='PACIENTE_ATUAL',
            acao=acao,
            dose=agente.dose_atual,
            linha_terapeutica=agente.linha_terapeutica,
            ecog=agente.fisiologia.ecog,
            eficacia=agente.clonal.eficacia_relativa(),
            estado_atual=agente.estado_atual,
            relatorio=relatorio
        )
        sessao.add(registro)
        sessao.commit()
        sessao.close()
