using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace training_backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Department",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Department", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Password = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    DepartmentId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SupervisorId = table.Column<string>(type: "nvarchar(450)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.Id);
                    table.ForeignKey(
                        name: "FK_User_Department_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Department",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_User_User_SupervisorId",
                        column: x => x.SupervisorId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TrainingAssessment",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssessmentCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Duration = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Format = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetGroup = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TrainerId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    NumberOfTrainees = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainerRole = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    QrCodeUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FeedbackLink = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    WorkedWell = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChangeFuture = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EffectivenessRating = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Recommendation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainerSignoffName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainerSignoffSignature = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainerSignoffSignatureType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainerSignoffSignatureData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainerSignoffDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SupervisorSignoffName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupervisorSignoffSignature = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupervisorSignoffSignatureType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupervisorSignoffSignatureData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupervisorSignoffDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingAssessment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingAssessment_User_TrainerId",
                        column: x => x.TrainerId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainerId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AssignedSupervisorId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Department = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainingDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DurationDays = table.Column<int>(type: "int", nullable: true),
                    DurationHours = table.Column<int>(type: "int", nullable: true),
                    NumberOfTrainees = table.Column<int>(type: "int", nullable: true),
                    TrainingFormat = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TargetAudience = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    FeedbackClosesAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DraftPayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedPayloadJson = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingSessions_User_AssignedSupervisorId",
                        column: x => x.AssignedSupervisorId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FollowUp",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssessmentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SupervisorId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ApplicationExtent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ImprovementObserved = table.Column<bool>(type: "bit", nullable: false),
                    SupportNeeded = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Barriers = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FollowUp", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FollowUp_TrainingAssessment_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "TrainingAssessment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FollowUp_User_SupervisorId",
                        column: x => x.SupervisorId,
                        principalTable: "User",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Report",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssessmentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PdfUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Report", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Report_TrainingAssessment_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "TrainingAssessment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TraineeFeedback",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssessmentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Department = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EmployeeNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ObjectivesClear = table.Column<int>(type: "int", nullable: false),
                    ContentRelevant = table.Column<int>(type: "int", nullable: false),
                    TrainerKnowledge = table.Column<int>(type: "int", nullable: false),
                    PaceAppropriate = table.Column<int>(type: "int", nullable: false),
                    PracticalUseful = table.Column<int>(type: "int", nullable: false),
                    Effectiveness = table.Column<int>(type: "int", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraineeFeedback", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TraineeFeedback_TrainingAssessment_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "TrainingAssessment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FeedbackSubmissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrainingSessionId = table.Column<int>(type: "int", nullable: false),
                    TraineeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackSubmissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbackSubmissions_TrainingSessions_TrainingSessionId",
                        column: x => x.TrainingSessionId,
                        principalTable: "TrainingSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainerReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrainingSessionId = table.Column<int>(type: "int", nullable: false),
                    OverallPassRate = table.Column<double>(type: "float", nullable: false),
                    SkillApplicationLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PerformanceImproved = table.Column<bool>(type: "bit", nullable: false),
                    SupportNeeded = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    WhatWorkedWell = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Improvements = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainerComment = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SupervisorComment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EffectivenessRating = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Recommendation = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainerName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainerSignature = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrainerSignatureStatus = table.Column<int>(type: "int", nullable: false),
                    TrainerDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SupervisorName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupervisorSignature = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SupervisorSignatureStatus = table.Column<int>(type: "int", nullable: false),
                    SupervisorDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SubmittedToSupervisor = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainerReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainerReports_TrainingSessions_TrainingSessionId",
                        column: x => x.TrainingSessionId,
                        principalTable: "TrainingSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TrainingObjectives",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssessmentId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    TrainingSessionId = table.Column<int>(type: "int", nullable: true),
                    Objective = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingObjectives", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingObjectives_TrainingAssessment_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "TrainingAssessment",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_TrainingObjectives_TrainingSessions_TrainingSessionId",
                        column: x => x.TrainingSessionId,
                        principalTable: "TrainingSessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KnowledgeAssessment",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    AssessmentId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TraineeFeedbackId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    DemonstratedUnderstanding = table.Column<bool>(type: "bit", nullable: false),
                    IndependentPerformance = table.Column<bool>(type: "bit", nullable: false),
                    AssessedBy = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KnowledgeAssessment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KnowledgeAssessment_TraineeFeedback_TraineeFeedbackId",
                        column: x => x.TraineeFeedbackId,
                        principalTable: "TraineeFeedback",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_KnowledgeAssessment_TrainingAssessment_AssessmentId",
                        column: x => x.AssessmentId,
                        principalTable: "TrainingAssessment",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "FeedbackAnswers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FeedbackSubmissionId = table.Column<int>(type: "int", nullable: false),
                    Question = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Answer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeedbackAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FeedbackAnswers_FeedbackSubmissions_FeedbackSubmissionId",
                        column: x => x.FeedbackSubmissionId,
                        principalTable: "FeedbackSubmissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TraineeAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TrainerReportId = table.Column<int>(type: "int", nullable: false),
                    TraineeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DemonstratedUnderstanding = table.Column<bool>(type: "bit", nullable: false),
                    CanPerformIndependently = table.Column<bool>(type: "bit", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TraineeAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TraineeAssessments_TrainerReports_TrainerReportId",
                        column: x => x.TrainerReportId,
                        principalTable: "TrainerReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackAnswers_FeedbackSubmissionId",
                table: "FeedbackAnswers",
                column: "FeedbackSubmissionId");

            migrationBuilder.CreateIndex(
                name: "IX_FeedbackSubmissions_TrainingSessionId",
                table: "FeedbackSubmissions",
                column: "TrainingSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_FollowUp_AssessmentId",
                table: "FollowUp",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_FollowUp_SupervisorId",
                table: "FollowUp",
                column: "SupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_KnowledgeAssessment_AssessmentId",
                table: "KnowledgeAssessment",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_KnowledgeAssessment_TraineeFeedbackId",
                table: "KnowledgeAssessment",
                column: "TraineeFeedbackId");

            migrationBuilder.CreateIndex(
                name: "IX_Report_AssessmentId",
                table: "Report",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_TraineeAssessments_TrainerReportId",
                table: "TraineeAssessments",
                column: "TrainerReportId");

            migrationBuilder.CreateIndex(
                name: "IX_TraineeFeedback_AssessmentId",
                table: "TraineeFeedback",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainerReports_TrainingSessionId",
                table: "TrainerReports",
                column: "TrainingSessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainingAssessment_TrainerId",
                table: "TrainingAssessment",
                column: "TrainerId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingObjectives_AssessmentId",
                table: "TrainingObjectives",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingObjectives_TrainingSessionId",
                table: "TrainingObjectives",
                column: "TrainingSessionId");

            migrationBuilder.CreateIndex(
                name: "IX_TrainingSessions_AssignedSupervisorId",
                table: "TrainingSessions",
                column: "AssignedSupervisorId");

            migrationBuilder.CreateIndex(
                name: "IX_User_DepartmentId",
                table: "User",
                column: "DepartmentId");

            migrationBuilder.CreateIndex(
                name: "IX_User_SupervisorId",
                table: "User",
                column: "SupervisorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeedbackAnswers");

            migrationBuilder.DropTable(
                name: "FollowUp");

            migrationBuilder.DropTable(
                name: "KnowledgeAssessment");

            migrationBuilder.DropTable(
                name: "Report");

            migrationBuilder.DropTable(
                name: "TraineeAssessments");

            migrationBuilder.DropTable(
                name: "TrainingObjectives");

            migrationBuilder.DropTable(
                name: "FeedbackSubmissions");

            migrationBuilder.DropTable(
                name: "TraineeFeedback");

            migrationBuilder.DropTable(
                name: "TrainerReports");

            migrationBuilder.DropTable(
                name: "TrainingAssessment");

            migrationBuilder.DropTable(
                name: "TrainingSessions");

            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "Department");
        }
    }
}
