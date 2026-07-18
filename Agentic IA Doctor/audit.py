from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
from config import CONFIG

Base = declarative_base()

class DecisaoClinicaAudit(Base):
    __tablename__ = 'decisoes_auditoria_medica'
    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50), index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    conduta_acao = Column(String(50))
    dosagem_mg = Column(Float)
    ecog_ps = Column(Integer)
    estado_patologico = Column(String(150))
    shap_contrib = Column(JSON)

class AuditorClinico:
    def __init__(self):
        # Pooling robusto contra concorrência multithread do Streamlit
        self.engine = create_engine(
            CONFIG["DB_URL"],
            pool_size=20,
            max_overflow=10,
            pool_timeout=30,
            pool_pre_ping=True
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

    def registrar_evento(self, patient_id, acao, dose, ecog, estado, shap_contrib):
        session = self.Session()
        try:
            reg = DecisaoClinicaAudit(
                patient_id=patient_id, conduta_acao=acao, dosagem_mg=float(dose),
                ecog_ps=int(ecog), estado_patologico=str(estado), shap_contrib=shap_contrib
            )
            session.add(reg)
            session.commit()
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()
