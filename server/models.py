from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    organizer = Column(String)
    description = Column(Text, nullable=True)
    targetAmount = Column(Integer, default=0)
    collectedAmount = Column(Integer, default=0)
    deliveryAddress = Column(String, nullable=True)
    deliveryDateTime = Column(DateTime, nullable=True)
    imageUrl = Column(String, nullable=True)
    status = Column(String, default="FUNDRAISING")
    designDetails = Column(Text, nullable=True)
    visibility = Column(String, default="PUBLIC")
    size = Column(String, nullable=True)
    flowerTypes = Column(String, nullable=True)
    
    pledges = relationship("Pledge", back_populates="project")
    review = relationship("Review", back_populates="project", uselist=False)
    
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    handleName = Column(String, index=True)
    points = Column(Integer, default=0)
    referralCode = Column(String, unique=True, index=True)
    pledges = relationship("Pledge", back_populates="user")

class Pledge(Base):
    __tablename__ = "pledges"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    user = relationship("User", back_populates="pledges")
    project = relationship("Project", back_populates="pledges")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"), unique=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    project = relationship("Project", back_populates="review")
    user = relationship("User")
    
class Venue(Base):
    __tablename__ = "venues"
    id = Column(Integer, primary_key=True, index=True)
    venueName = Column(String, unique=True, index=True)
    regulations = Column(Text, nullable=True)