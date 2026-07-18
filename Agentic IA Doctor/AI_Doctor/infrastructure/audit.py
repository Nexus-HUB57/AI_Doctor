import datetime
import json
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import CONFIG

Base = declarative_base()

class DecisaoClinicaAudit(Base):
    __tablename__ = 'decisoes_auditoria_medica'
    id = Column(Integer, primary_key=True)
    patient_id = Column(String(50), index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    conduta_acao = Column(String(50))
    dosagem_mg = Column(Float)
    linha_terapeutica = Column(Integer)
    ecog_ps = Column(Integer)
    eficacia_clonal = Column(Float)
    estado_patologico = Column(String(150))
    relatorio_xai = Column(String(3000))
    shap_contrib = Column(JSON)

class AuditorClinico:
    def __init__(self, db_url=CONFIG["DB_URL"]):
        self.engine = create_engine(
            db_url,
            pool_size=20,
            max_overflow=10,
            pool_timeout=30,
            pool_pre_ping=True
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def registrar_evento(self, patient_id, acao, dose, linha, ecog, eficacia, estado, relatorio_xai, shap_contrib):
        session = self.Session()
        try:
            reg = DecisaoClinicaAudit(
                patient_id=patient_id,
                conduta_acao=acao,
                dosagem_mg=float(dose),
                linha_terapeutica=int(linha),
                ecog_ps=int(ecog),
                eficacia_clonal=float(eficacia),
                estado_patologico=str(estado),
                relatorio_xai=relatorio_xai,
                shap_contrib=shap_contrib
            )
            session.add(reg)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
